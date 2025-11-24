chrome.storage.sync.get(['enabled'], (result) => {
  const isEnabled = result.enabled !== false;
  
  if (isEnabled) {
    document.documentElement.classList.add('opendyslexic-enabled');
  } else {
    document.documentElement.classList.remove('opendyslexic-enabled');
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.enabled) {
    if (changes.enabled.newValue) {
      document.documentElement.classList.add('opendyslexic-enabled');
    } else {
      document.documentElement.classList.remove('opendyslexic-enabled');
    }
  }
});
