/* Synora Content Script — Text Highlight Capture */

(function () {
  'use strict';

  let floatingBtn = null;
  let currentSelection = '';

  // ── Create the floating button DOM element ──────────────────────────────────
  function createButton() {
    const btn = document.createElement('div');
    btn.id = 'synora-float-btn';
    btn.setAttribute('data-synora', 'true');
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span>Save to Synora</span>
    `;

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentSelection) return;

      // Visual feedback
      btn.classList.add('synora-btn-saving');
      btn.querySelector('span').textContent = 'Saving…';

      chrome.runtime.sendMessage(
        {
          type: 'SYNORA_CAPTURE_TEXT',
          text: currentSelection,
          sourceUrl: window.location.href
        },
        (response) => {
          if (chrome.runtime.lastError || !response?.success) {
            btn.classList.remove('synora-btn-saving');
            btn.classList.add('synora-btn-error');
            btn.querySelector('span').textContent = 'Not logged in';
            setTimeout(removeButton, 1500);
          } else {
            btn.classList.remove('synora-btn-saving');
            btn.classList.add('synora-btn-success');
            btn.querySelector('span').textContent = 'Saved ✓';
            setTimeout(removeButton, 1200);
          }
        }
      );
    });

    return btn;
  }

  function removeButton() {
    if (floatingBtn) {
      floatingBtn.classList.add('synora-btn-hide');
      setTimeout(() => {
        floatingBtn?.remove();
        floatingBtn = null;
      }, 200);
    }
  }

  function positionButton(x, y) {
    if (!floatingBtn) return;
    const viewportWidth = window.innerWidth;
    const btnWidth = 160;
    let left = x;
    if (left + btnWidth > viewportWidth - 16) {
      left = viewportWidth - btnWidth - 16;
    }
    floatingBtn.style.left = `${left}px`;
    floatingBtn.style.top = `${y - 52}px`; // above the cursor
  }

  // ── Mouse up: check for selection ──────────────────────────────────────────
  document.addEventListener('mouseup', (e) => {
    // Ignore clicks inside our own button
    if (e.target?.closest?.('[data-synora]')) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 10) {
        removeButton();
        currentSelection = '';
        return;
      }

      currentSelection = text;

      if (!floatingBtn) {
        floatingBtn = createButton();
        document.body.appendChild(floatingBtn);
        // Trigger show animation
        requestAnimationFrame(() => floatingBtn?.classList.add('synora-btn-visible'));
      } else {
        // Reset in case it was in an error/success state
        floatingBtn.classList.remove('synora-btn-saving', 'synora-btn-error', 'synora-btn-success');
        floatingBtn.querySelector('span').textContent = 'Save to Synora';
      }

      positionButton(e.clientX + window.scrollX, e.clientY + window.scrollY);
    }, 10);
  });

  // ── Click outside: dismiss button ──────────────────────────────────────────
  document.addEventListener('mousedown', (e) => {
    if (e.target?.closest?.('[data-synora]')) return;
    removeButton();
  });

  // ── Scroll: reposition button ───────────────────────────────────────────────
  document.addEventListener('scroll', () => {
    if (floatingBtn) removeButton();
  }, { passive: true });

})();
