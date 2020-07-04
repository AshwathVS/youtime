"use strict";

function onWebNav(details) {
  if (details.frameId === 0) {
    chrome.pageAction.show(details.tabId);
    chrome.pageAction.setTitle({
      tabId: details.tabId,
      title: "Extension enabled",
    });
    chrome.pageAction.setIcon({
      tabId: details.tabId,
      path: "images/icon-enabled-16.png",
    });
  }
}
var filter = {
  url: [
    {
      hostEquals: "www.youtube.com",
    },
  ],
};

chrome.webNavigation.onCommitted.addListener(onWebNav, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(onWebNav, filter);
