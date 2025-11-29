# FakeCheck AI - Chrome Extension

A browser extension that helps you identify fake news while browsing the web.

## Features

- Check news credibility with a single click
- Hover-based tooltip detection
- Real-time fact-checking from backend API
- Community accuracy scores
- User feedback integration

## Installation

1. Build the extension files (they're in the `extension` folder)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right corner)
4. Click "Load unpacked"
5. Select the `extension` folder
6. The extension is now installed!

## Configuration

1. Click the extension icon in your browser toolbar
2. Click the "⚙️ Settings" button
3. Enter your backend API URL (default: http://localhost:5000)
4. Click "Save Settings"

## Usage

### Check News

1. Select any news text on a webpage
2. Click the "FakeCheck AI" badge that appears
3. The extension will analyze the text and show results

### Provide Feedback

1. After getting results, click "Correct" or "Incorrect" to help improve accuracy
2. Your feedback helps train the community accuracy score

## Development

### File Structure

- `manifest.json` - Extension configuration
- `popup.html/js/css` - Main UI popup
- `background.js` - Service worker for event handling
- `content.js` - Page content interaction script

### Testing

1. Make changes to files
2. Go to `chrome://extensions/`
3. Click the reload icon next to the extension
4. Test your changes

## Troubleshooting

**Extension not connecting to backend:**
- Ensure backend is running on the configured API URL
- Check CORS settings in backend (localhost:3000/3001 should be allowed)
- Update API URL in extension settings

**Popup not loading:**
- Check browser console for errors (right-click popup → Inspect)
- Ensure all CSS files are properly referenced

**No text selection detection:**
- Content script only works on regular web pages
- Chrome tabs, extensions, and some secure sites are restricted
