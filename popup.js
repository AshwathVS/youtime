document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, { action: "getData" }, populateTimestamps);
  });

  document
    .getElementById("btn-previous")
    .addEventListener("click", function () {
      navigate("previous");
    });

  document.getElementById("btn-next").addEventListener("click", function () {
    navigate("next");
  });

  document.getElementById("btn-refresh").addEventListener("click", function () {
    navigate("refresh");
  });
});

function populateTimestamps(data) {
  if (!data) return; // TODO: Add no timestamps found message

  const pageData = data.pageData;
  const regex = new RegExp(
    "(?:[\\[\\(\\{]?((?:\\d?\\d:)?(?:\\d?\\d:)(?:\\d?\\d))[\\]\\)\\}]?)(?:\\n| *\\W*\\ *([^\\n]*)\\n)",
    "g"
  );

  // Getting all the timestamps present in the page
  var match = regex.exec(pageData);
  var timestamps = new Map();

  while (match != null) {
    const timestamp = match[1];
    var description = match[2];
    description = description ? description.trim() : "";

    if (description.indexOf("\n") === -1) {
      if (!timestamps.has(timestamp)) {
        timestamps.set(timestamp, description);
      }
    } else {
      if (!timestamps.has(timestamp)) {
        timestamps.set(timestamp, "");
      }
    }

    match = regex.exec(pageData);
  }

  const followupRegex = new RegExp(
    "[a-zA-Z' ]+(?=((\\d?\\d:)?(\\d?\\d:)(\\d?\\d)))",
    "g"
  );

  match = followupRegex.exec(pageData);

  while (match != null) {
    const timestamp = match[1];
    var description = match[0];
    description = description ? description.trim() : "";

    if (timestamps.has(timestamp)) {
      if (description.length > timestamps.get(timestamp)) {
        timestamps.set(timestamp, description);
      }
    } else {
      timestamps.set(timestamp, description);
    }

    match = followupRegex.exec(pageData);
  }

  populate(timestamps);
}

function populate(timestamps) {
  var timestampsToDisplay = new Map();

  for (let [key, value] of timestamps) {
    var seconds = getSeconds(key);
    if (
      !timestampsToDisplay.has(seconds) ||
      (timestampsToDisplay.has(seconds) &&
        value.length > timestampsToDisplay.get(seconds).length)
    ) {
      timestampsToDisplay.set(seconds, { display: key, description: value });
    }
  }

  timestampsToDisplay = new Map(
    [...timestampsToDisplay].sort((a, b) => (a[0] > b[0] ? 1 : -1))
  );

  if (timestampsToDisplay && timestampsToDisplay.size > 0) {
    document.getElementById("timestamps").innerHTML = "";
    var timeStampDiv = document.getElementById("timestamps");
    var counter = 1;
    for (let [key, value] of timestampsToDisplay) {
      var div = document.createElement("div");
      div.style.paddingTop = "1%";
      div.style.paddingBottom = "1%";
      var button = document.createElement("input");

      const id = "btn-" + counter;
      button.id = id;
      button.type = "button";
      button.value = value.display;
      button.classList.add("btn", "btn-outline-danger", "btn-custom-fixed");

      button.onclick = function () {
        markAsActive(id);
        chrome.tabs.getSelected(null, function (tab) {
          chrome.tabs.sendRequest(tab.id, {
            action: "seekTo",
            seconds: key,
          });
        });
      };

      var label = document.createElement("span");
      label.style.paddingLeft = "5%";
      label.style.color = "white";
      label.innerText = value.description
        ? value.description
        : "Hoping for something good! (No info found)";

      div.appendChild(button);
      div.appendChild(label);

      timeStampDiv.appendChild(div);
      counter++;
    }
    counter--;
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendRequest(tab.id, { action: "getURL" }, function (url) {
        chrome.storage.sync.get([url], function (data) {
          var activeBtn = data ? data[url] : undefined;
          if (activeBtn) {
            markButton(activeBtn, true);
          }
        });
      });
    });
  }
}

function getSeconds(timestampString) {
  var arr = timestampString.split(":");
  var seconds = 0,
    tmp = 1;
  for (var i = arr.length - 1; i >= 0; i--) {
    seconds += parseInt(arr[i]) * tmp;
    tmp *= 60;
  }
  return seconds;
}

function navigate(buttonClicked) {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, { action: "getURL" }, function (url) {
      chrome.storage.sync.get([url], function (currentActiveBtnId) {
        var currentIndex;
        if (currentActiveBtnId) {
          currentIndex = currentActiveBtnId[url].split("-")[1];
        } else {
          currentIndex = 0;
        }

        var totaltimestamps = document.getElementById("timestamps").children
          .length;
        switch (buttonClicked) {
          case "previous": {
            currentIndex--;
            if (currentIndex < 0) {
              currentIndex = totaltimestamps;
            }
            markAsActive("btn-" + currentIndex);
            document.getElementById("btn-" + currentIndex)
              ? document.getElementById("btn-" + currentIndex).click()
              : "";
            break;
          }
          case "next": {
            currentIndex++;
            if (currentIndex > totaltimestamps) {
              currentIndex = 1;
            }
            markAsActive("btn-" + currentIndex);
            document.getElementById("btn-" + currentIndex)
              ? document.getElementById("btn-" + currentIndex).click()
              : "";
            break;
          }
          case "refresh": {
            chrome.tabs.getSelected(null, function (tab) {
              chrome.tabs.sendRequest(
                tab.id,
                { action: "getData" },
                populateTimestamps
              );
            });
            break;
          }
        }
      });
    });
  });
}

function markAsActive(btnId) {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, { action: "getURL" }, function (url) {
      chrome.storage.sync.get([url], function (currentActiveBtn) {
        currentActiveBtn = currentActiveBtn[url];
        if (btnId == undefined) {
          markButton(currentActiveBtn, true);
        } else {
          markButton(currentActiveBtn, false);
          chrome.storage.sync.set({ [url]: btnId }, function () {
            console.log("Value is set to " + btnId);
            markButton(btnId, true);
          });
        }
      });
    });
  });
}

function markButton(btn, isActive) {
  if (btn) {
    if (isActive && document.getElementById(btn)) {
      document.getElementById(btn).classList.remove("btn-outline-danger");
      document.getElementById(btn).classList.add("btn-outline-success");
    } else {
      if (document.getElementById(btn)) {
        document.getElementById(btn).classList.remove("btn-outline-success");
        document.getElementById(btn).classList.add("btn-outline-danger");
      }
    }
  }
}
