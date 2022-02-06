// background.js

const color = '#FF99CC';
const dingus = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ dingus });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});
