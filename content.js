// Ensures that the color scheme is set to the user's preference (even if the page defines its own color scheme).
(async () => {
  const url = window.location.hostname;

  const getSiteScheme = async (hostname) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([hostname], (result) => {
        resolve(result[hostname]);
      });
    });
  };

  const scheme = await getSiteScheme(url);
  if (scheme) {
    document.documentElement.style.colorScheme =
      scheme === "Unset" ? "" : scheme.toLowerCase();
  }
})();
