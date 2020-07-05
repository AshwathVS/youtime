chrome.extension.onRequest.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.action == "getData")
    sendResponse({
      pageData:
        document.getElementById("meta").innerText +
        "\n" +
        document.getElementById("comments").innerText,
    });
  else if (request.action == "seekTo") {
    document.dispatchEvent(
      new CustomEvent("seekToSecond", { detail: request.seconds })
    );
  } else sendResponse({});
});

var s = document.createElement("script");
s.src = chrome.runtime.getURL("script.js");
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);
