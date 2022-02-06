const pressK = document.getElementById('pauseBtn');
const summonDingus = document.getElementById('summonDingus');

pressK.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: togglePlaying,
  });
});

function togglePlaying() {
  console.log('deez nuts');
  const video = document.querySelector('video');
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

summonDingus.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.storage.local.get(['dingus'], (data) => {
    const updatedDingusFlag = !data.dingus;
    if (updatedDingusFlag) {
      document.getElementById('dingoBtnTxt').innerText = 'dismiss dingus';
    } else {
      document.getElementById('dingoBtnTxt').innerText = 'summon dingus';
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (flag) => { chrome.storage.local.set({ dingus: flag }); },
      args: [updatedDingusFlag],
    });
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.hasOwnProperty('activation')) {
    chrome.storage.local.get('activation', (data) => {
      document.getElementById('activation').innerText = "Activate Dingus with: " + data.activation.toString();
    });
  }
});