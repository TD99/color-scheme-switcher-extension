const CONTEXT_MENU_ENABLED_KEY = "contextMenuEnabled";

chrome.runtime.onInstalled.addListener(() => {
  console.info(
    "Extension " + chrome.runtime.getManifest().name + " has been installed."
  );
});

chrome.tabs.onActivated.addListener(async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tab && tab.url) {
    const url = new URL(tab.url);
    const savedScheme = await getSiteScheme(url.hostname);
    if (savedScheme) {
      applyColorScheme(tab.id, savedScheme);
    }
  }
});

const getSiteScheme = async (hostname) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([hostname], (result) => {
      resolve(result[hostname]);
    });
  });
};

const applyColorScheme = (tabId, scheme) => {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (scheme) => {
      document.documentElement.style.colorScheme =
        scheme === "Unset" ? "" : scheme.toLowerCase();
    },
    args: [scheme],
  });
};
