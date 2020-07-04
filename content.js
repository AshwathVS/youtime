chrome.extension.onRequest.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.action == "getData")
    sendResponse({
      url: document.URL,
      dom: document.documentElement.innerHTML,
    });
  else sendResponse({});
});
