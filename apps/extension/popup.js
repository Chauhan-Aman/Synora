const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('login-screen');
  const captureScreen = document.getElementById('capture-screen');
  
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const authError = document.getElementById('auth-error');

  const currentTitle = document.getElementById('current-title');
  const currentUrl = document.getElementById('current-url');
  const captureBtn = document.getElementById('capture-btn');
  const captureStatus = document.getElementById('capture-status');
  const logoutBtn = document.getElementById('logout-btn');

  let currentTabUrl = '';

  // Check if user is already logged in
  chrome.storage.local.get(['synora_token'], async (result) => {
    if (result.synora_token) {
      showCaptureScreen();
    }
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    loginBtn.textContent = 'Connecting...';
    authError.classList.add('hidden');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      chrome.storage.local.set({ synora_token: data.access_token }, () => {
        showCaptureScreen();
      });
    } catch (err) {
      authError.textContent = err.message;
      authError.classList.remove('hidden');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Connect';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['synora_token'], () => {
      loginScreen.classList.add('active');
      loginScreen.classList.remove('hidden');
      captureScreen.classList.remove('active');
      captureScreen.classList.add('hidden');
      captureStatus.classList.add('hidden');
    });
  });

  // Handle Capture
  captureBtn.addEventListener('click', async () => {
    if (!currentTabUrl) return;
    
    captureBtn.disabled = true;
    captureBtn.innerHTML = 'Sending...';
    captureStatus.classList.add('hidden');

    chrome.storage.local.get(['synora_token'], async (result) => {
      try {
        const res = await fetch(`${API_URL}/capture`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.synora_token}`
          },
          body: JSON.stringify({
            type: 'URL',
            sourceUrl: currentTabUrl
          })
        });

        if (res.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        }

        if (!res.ok) throw new Error('Failed to capture');

        captureStatus.textContent = 'Successfully saved to graph!';
        captureStatus.className = 'status success';
        captureBtn.innerHTML = 'Saved ✓';
        
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err) {
        if (err.message.includes('Unauthorized')) {
          logoutBtn.click();
        } else {
          captureStatus.textContent = err.message;
          captureStatus.className = 'status error';
          captureBtn.disabled = false;
          captureBtn.innerHTML = 'Try Again';
        }
      }
    });
  });

  function showCaptureScreen() {
    loginScreen.classList.remove('active');
    loginScreen.classList.add('hidden');
    captureScreen.classList.add('active');
    captureScreen.classList.remove('hidden');

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        currentTitle.textContent = tab.title || 'Unknown Page';
        currentUrl.textContent = tab.url || '';
        currentTabUrl = tab.url || '';
      }
    });
  }
});
