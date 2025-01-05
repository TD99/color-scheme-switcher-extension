document.addEventListener("DOMContentLoaded", async () => {
  const schemeDropdown = document.getElementById("color-scheme");
  const cannotSetMessage = document.getElementById("cannot-set-message");
  const siteList = document.getElementById("site-list");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ? new URL(tab.url) : null;
  const hostname = url?.hostname;

  const savedScheme = hostname ? await getSiteScheme(hostname) : null;
  schemeDropdown.value = savedScheme || "Unset";

  schemeDropdown.addEventListener("change", () => {
    const scheme = schemeDropdown.value;

    if (scheme === "Unset") {
      chrome.storage.local.remove(hostname);
    } else {
      chrome.storage.local.set({ [hostname]: scheme });
    }

    applyColorScheme(tab.id, scheme);
  });

  if (!(await testIfCurrentPageCanBeModified(tab.id))) {
    schemeDropdown.style.display = "none";
    cannotSetMessage.style.display = "block";
  }

  const displaySiteList = async () => {
    const settings = await getStoredSettings();
    siteList.innerHTML = "";

    for (const [site, scheme] of Object.entries(settings)) {
      if (
        site === hostname &&
        !(await testIfCurrentPageCanBeModified(tab.id))
      ) {
        continue;
      }

      const controlsDiv = document.createElement("div");

      const li = document.createElement("li");
      const select = document.createElement("select");

      const siteUrlSpan = document.createElement("span");
      siteUrlSpan.className = "site-url";
      siteUrlSpan.textContent = site;

      ["Light", "Dark"].forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        opt.selected = option === scheme;
        select.appendChild(opt);
      });

      select.addEventListener("change", () => {
        const newScheme = select.value;
        chrome.storage.local.set({ [site]: newScheme });

        if (site === hostname) {
          schemeDropdown.value = newScheme;
          applyColorScheme(tab.id, newScheme);
        }
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.addEventListener("click", () => {
        chrome.storage.local.remove(site, displaySiteList);

        if (site === hostname) {
          schemeDropdown.value = "Unset";
          applyColorScheme(tab.id, "Unset");
        }
      });

      controlsDiv.appendChild(select);
      controlsDiv.appendChild(deleteButton);

      li.appendChild(siteUrlSpan);
      li.appendChild(controlsDiv);
      siteList.appendChild(li);
    }
  };

  displaySiteList();

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "local") {
      displaySiteList();
    }
  });
});

const getStoredSettings = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      resolve(result);
    });
  });
};

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

const testIfCurrentPageCanBeModified = async (tabId) => {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        return true;
      },
    });

    return result[0];
  } catch {
    console.warn("The current page cannot be modified by this extension.");
    return false;
  }
};
