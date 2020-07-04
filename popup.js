document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, { action: "getData" }, populateTimestamps);
  });
  //   // onClick's logic below:
  //   link.addEventListener("click", function () {
  //     testing();
  //   });
});

function populateTimestamps(data) {
  const pageUrl = data.url;
  const pageData = data.dom;
  // fetching page url

  // Getting the video Id from the page url
  var regex = new RegExp("/watch\\?v=(\\w+)");
  var videoId = regex.exec(pageUrl);
  if (videoId) videoId = videoId[1];
  else return;
  const timestampRegex = "/watch\\?v=" + videoId + ".*&amp;t=[0-9]+s";

  // Getting all the timestamps present in the page
  var matches = pageData.matchAll(timestampRegex);
  var timestamps = new Set();
  for (const match of matches) {
    timestamps.add(match[0].replace("&amp;", "&"));
  }

  // Populating the timestamps in the list
  if (timestamps) {
    var ul = document.getElementById("timestamps");
    timestamps.forEach((element) => {
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(element));
      ul.appendChild(li);
    });
  }
}
