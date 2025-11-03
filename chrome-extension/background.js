// Service worker background script for the webcam overlay extension.

// We maintain a simple toggle state so that each click on the extension's
// toolbar icon alternately shows or hides the webcam overlay. Because service
// workers may be unloaded at any moment, we persist the state using a
// global variable. When the worker is reloaded the state resets and the
// overlay will start hidden.
let overlayEnabled = false;

// Listen for clicks on the browser action. When the user clicks the icon,
// flip the toggle state and inject the content script if necessary. Then send
// a message to the content script in the active tab instructing it to show
// or hide the webcam overlay.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    overlayEnabled = !overlayEnabled;
    // Inject the content script. The `scripting.executeScript` API will only
    // inject the script once per tab; subsequent executions reuse the
    // previously injected script. This ensures our message listener is
    // registered without duplicating the overlay elements.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    // Send a message to the content script indicating whether to show or hide
    // the overlay. We use a simple string action to signal the desired state.
    chrome.tabs.sendMessage(tab.id, { action: overlayEnabled ? 'show' : 'hide' });
    // Optionally update the icon badge or icon to reflect the current state.
    chrome.action.setBadgeText({ text: overlayEnabled ? 'ON' : '' });
  } catch (err) {
    console.error('Failed to toggle webcam overlay:', err);
  }
});