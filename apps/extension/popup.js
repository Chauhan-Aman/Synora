const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const loginScreen   = document.getElementById('login-screen');
  const mainScreen    = document.getElementById('main-screen');
  const loginForm     = document.getElementById('login-form');
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn      = document.getElementById('login-btn');
  const authError     = document.getElementById('auth-error');

  const currentTitle  = document.getElementById('current-title');
  const currentUrl    = document.getElementById('current-url');
  const captureBtn    = document.getElementById('capture-btn');
  const captureStatus = document.getElementById('capture-status');
  const logoutBtn     = document.getElementById('logout-btn');

  const tabBtns       = document.querySelectorAll('.tab-btn');
  const panelCapture  = document.getElementById('panel-capture');
  const panelAsk      = document.getElementById('panel-ask');

  const askInput      = document.getElementById('ask-input');
  const askBtn        = document.getElementById('ask-btn');
  const askMessages   = document.getElementById('ask-messages');
  const askStatus     = document.getElementById('ask-status');

  let currentTabUrl = '';

  // ── Auth check ────────────────────────────────────────────────────────────
  chrome.storage.local.get(['synora_token'], (result) => {
    if (result.synora_token) showMainScreen();
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    loginBtn.textContent = 'Connecting…';
    authError.classList.add('hidden');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      chrome.storage.local.set({ synora_token: data.access_token }, showMainScreen);
    } catch (err) {
      authError.textContent = err.message;
      authError.classList.remove('hidden');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Connect';
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['synora_token'], () => {
      mainScreen.classList.add('hidden');
      mainScreen.classList.remove('active');
      loginScreen.classList.add('active');
      loginScreen.classList.remove('hidden');
    });
  });

  // ── Tab switching ─────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'capture') {
        panelCapture.classList.remove('hidden');
        panelCapture.classList.add('active');
        panelAsk.classList.add('hidden');
        panelAsk.classList.remove('active');
      } else {
        panelAsk.classList.remove('hidden');
        panelAsk.classList.add('active');
        panelCapture.classList.add('hidden');
        panelCapture.classList.remove('active');
        askInput.focus();
      }
    });
  });

  // ── Capture ───────────────────────────────────────────────────────────────
  captureBtn.addEventListener('click', async () => {
    if (!currentTabUrl) return;
    captureBtn.disabled = true;
    captureBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Saving…';
    captureStatus.classList.add('hidden');

    chrome.storage.local.get(['synora_token'], async (result) => {
      try {
        const res = await fetch(`${API_URL}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.synora_token}`
          },
          body: JSON.stringify({ type: 'URL', sourceUrl: currentTabUrl })
        });

        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (!res.ok) throw new Error('Failed to capture page');

        captureStatus.textContent = '✓ Saved to your knowledge graph!';
        captureStatus.className = 'status success';
        captureStatus.classList.remove('hidden');
        captureBtn.innerHTML = '✓ Saved!';

        setTimeout(() => window.close(), 1800);
      } catch (err) {
        if (err.message.includes('expired') || err.message.includes('401')) {
          logoutBtn.click();
        } else {
          captureStatus.textContent = err.message;
          captureStatus.className = 'status error';
          captureStatus.classList.remove('hidden');
          captureBtn.disabled = false;
          captureBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Try Again';
        }
      }
    });
  });

  // ── Ask / Mini-Chat ───────────────────────────────────────────────────────
  askInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askBtn.click();
    }
  });

  askBtn.addEventListener('click', async () => {
    const question = askInput.value.trim();
    if (!question) return;

    askBtn.disabled = true;
    askInput.disabled = true;
    askInput.value = '';

    // Remove placeholder
    const placeholder = askMessages.querySelector('.msg-placeholder');
    placeholder?.remove();

    // Add user bubble
    appendMessage(question, 'user');

    // Add streaming AI bubble
    const aiBubble = appendMessage('', 'ai');
    const aiText = aiBubble.querySelector('.bubble-text');
    aiText.textContent = '…';

    chrome.storage.local.get(['synora_token'], async (result) => {
      const token = result.synora_token;
      if (!token) {
        aiText.textContent = 'Please log in first.';
        resetAskInput();
        return;
      }

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: question })
        });

        if (!res.ok || !res.body) throw new Error('Chat unavailable');

        aiText.textContent = '';
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const d = JSON.parse(part.slice(6));
                if (d.type === 'text') {
                  aiText.textContent += d.text;
                  askMessages.scrollTop = askMessages.scrollHeight;
                }
              } catch {}
            }
          }
        }
        if (!aiText.textContent) aiText.textContent = '(No response)';
      } catch (err) {
        aiText.textContent = '⚠ ' + err.message;
      }

      resetAskInput();
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showMainScreen() {
    loginScreen.classList.remove('active');
    loginScreen.classList.add('hidden');
    mainScreen.classList.add('active');
    mainScreen.classList.remove('hidden');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        currentTitle.textContent = tab.title || 'Unknown Page';
        currentUrl.textContent = tab.url || '';
        currentTabUrl = tab.url || '';
      }
    });
  }

  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className = `msg msg-${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const p = document.createElement('p');
    p.className = 'bubble-text';
    p.textContent = text;
    bubble.appendChild(p);
    div.appendChild(bubble);
    askMessages.appendChild(div);
    askMessages.scrollTop = askMessages.scrollHeight;
    return div;
  }

  function resetAskInput() {
    askBtn.disabled = false;
    askInput.disabled = false;
    askInput.focus();
  }
});
