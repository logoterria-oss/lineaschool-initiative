const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

chrome.storage.sync.get(['enabled'], (result) => {
  const isEnabled = result.enabled !== false;
  updateUI(isEnabled);
});

toggle.addEventListener('click', () => {
  const isEnabled = !toggle.classList.contains('active');
  
  chrome.storage.sync.set({ enabled: isEnabled }, () => {
    updateUI(isEnabled);
    showStatus(isEnabled);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});

function updateUI(isEnabled) {
  if (isEnabled) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

function showStatus(isEnabled) {
  status.textContent = isEnabled ? '✓ Шрифт включён' : '✗ Шрифт отключён';
  status.className = 'status show ' + (isEnabled ? 'enabled' : 'disabled');
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 2000);
}
