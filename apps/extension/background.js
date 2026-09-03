const API_URL = 'http://localhost:3000';
const ACCENT_GREEN = '#10b981';

// ─── INSTALL: create context menu ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'synora-save-page',
    title: '✦ Save page to Synora',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'synora-save-selection',
    title: '✦ Save selection to Synora',
    contexts: ['selection']
  });

  // Set badge style
  chrome.action.setBadgeBackgroundColor({ color: ACCENT_GREEN });
  updateBadge();
});

// ─── CONTEXT MENU HANDLER ──────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.storage.local.get(['synora_token'], async (result) => {
    const token = result.synora_token;
    if (!token) {
      // Flash the popup open so they can log in
      chrome.action.openPopup?.();
      return;
    }

    if (info.menuItemId === 'synora-save-page') {
      const url = info.linkUrl || tab.url;
      await captureUrl(url, token, tab.id);
    }

    if (info.menuItemId === 'synora-save-selection') {
      const text = info.selectionText;
      await captureText(text, tab.url, token, tab.id);
    }
  });
});

// ─── MESSAGE FROM CONTENT SCRIPT ──────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNORA_CAPTURE_TEXT') {
    chrome.storage.local.get(['synora_token'], async (result) => {
      const token = result.synora_token;
      if (!token) {
        sendResponse({ success: false, error: 'Not logged in' });
        return;
      }
      const ok = await captureText(message.text, message.sourceUrl, token, sender.tab?.id);
      sendResponse({ success: ok });
    });
    return true; // keep channel open for async
  }

  if (message.type === 'SYNORA_CAPTURE_URL') {
    chrome.storage.local.get(['synora_token'], async (result) => {
      const token = result.synora_token;
      if (!token) {
        sendResponse({ success: false, error: 'Not logged in' });
        return;
      }
      const ok = await captureUrl(message.url, token, sender.tab?.id);
      sendResponse({ success: ok });
    });
    return true;
  }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function captureUrl(url, token, tabId) {
  try {
    const res = await fetch(`${API_URL}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'URL', sourceUrl: url })
    });
    if (res.ok) {
      showTabNotification(tabId, '✓ Page saved to Synora!', 'success');
      setTimeout(updateBadge, 3000); // give backend time to process
      return true;
    }
    showTabNotification(tabId, '✗ Failed to save page', 'error');
    return false;
  } catch {
    showTabNotification(tabId, '✗ Cannot reach Synora', 'error');
    return false;
  }
}

async function captureText(text, sourceUrl, token, tabId) {
  try {
    const res = await fetch(`${API_URL}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type: 'TEXT', content: text, sourceUrl })
    });
    if (res.ok) {
      showTabNotification(tabId, '✓ Selection saved to Synora!', 'success');
      setTimeout(updateBadge, 3000);
      return true;
    }
    showTabNotification(tabId, '✗ Failed to save selection', 'error');
    return false;
  } catch {
    showTabNotification(tabId, '✗ Cannot reach Synora', 'error');
    return false;
  }
}

async function updateBadge() {
  chrome.storage.local.get(['synora_token'], async (result) => {
    const token = result.synora_token;
    if (!token) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/knowledge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const count = data.artifacts?.length || 0;
      chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
    } catch {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

function showTabNotification(tabId, message, type) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg, t) => {
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        padding: 10px 16px; border-radius: 10px; font-family: Inter, sans-serif;
        font-size: 13px; font-weight: 600; color: white;
        background: ${t === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)'};
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        animation: synora-slide-in 0.3s ease;
        pointer-events: none;
      `;
      document.head.insertAdjacentHTML('beforeend', `
        <style>@keyframes synora-slide-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}</style>
      `);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    },
    args: [message, type]
  }).catch(() => {}); // silently fail on restricted pages
}

// Update badge every 5 minutes while extension is active
setInterval(updateBadge, 5 * 60 * 1000);
