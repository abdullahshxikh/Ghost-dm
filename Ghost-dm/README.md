# Ghost DM

**Block Instagram read receipts to maintain privacy in direct messages**

Ghost DM is a Chrome extension that prevents Instagram from sending read receipts when you view direct messages. Read messages without the sender knowing you've seen them.

![Ghost DM Screenshot](https://via.placeholder.com/800x400/2a2a3e/e0e0e0?text=Ghost+DM+Extension+Screenshot)

## Features

- **Block Read Receipts**: Prevents Instagram from sending "seen" notifications when you read DMs
- **Maintain Privacy**: Read messages without appearing online or active
- **Targeted Blocking**: Only blocks read receipt requests, normal Instagram functionality remains intact
- **Local Processing**: No data collection, everything runs locally in your browser

## How It Works

Ghost DM uses Chrome's modern `declarativeNetRequest` API to intercept and block specific Instagram API calls:

- **Target URLs**: `/direct_v2/threads/*/seen`
- **Method**: Declarative network request blocking (Manifest V3)
- **Scope**: Only affects Instagram read receipt endpoints
- **Performance**: Zero impact on browsing speed or Instagram functionality

### Technical Details

```javascript
// Blocked request patterns:
- https://i.instagram.com/api/v1/direct_v2/threads/[THREAD_ID]/seen
- https://www.instagram.com/api/v1/direct_v2/threads/[THREAD_ID]/seen
```

When Ghost Mode is **ON**, these requests are blocked at the network level before they reach Instagram's servers.

## Installation

### Install Locally (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/ghost-dm
   cd ghost-dm
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `ghost-dm` folder
   - The extension will appear in your toolbar

4. **Start Using**
   - Click the Ghost DM icon in your toolbar
   - Toggle "Ghost Mode" ON
   - Browse Instagram DMs normally

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once reviewed and approved.

## Usage

### Basic Usage

1. **Enable Ghost Mode**
   - Click the Ghost DM extension icon
   - Toggle the switch to enable Ghost Mode
   - The indicator will turn green when active

2. **Read Messages Privately**
   - Open Instagram in any tab
   - Read DMs normally
   - Senders won't see "seen" notifications

3. **Disable When Needed**
   - Toggle Ghost Mode OFF to resume normal read receipts
   - Useful when you want to let someone know you've read their message

### Visual Indicators

- **Green**: Ghost Mode is active, read receipts blocked
- **White**: Ghost Mode is inactive, read receipts visible
- **Toast Notifications**: Real-time feedback when requests are blocked

## File Structure

```
ghost-dm/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for extension logic
├── content.js             # Content script for Instagram pages
├── early-inject.js        # Early injection script for timing
├── popup.html             # Extension popup interface
├── popup.js               # Popup script logic
├── styles.css             # Extension styling
├── rules.json             # DeclarativeNetRequest rules
├── icon.png               # Extension icon
└── README.md              # This file
```

## Privacy & Security

- **No Data Collection**: The extension does not collect, store, or transmit any personal data
- **Local Processing**: All blocking logic runs locally in your browser
- **Minimal Permissions**: Only requests access to Instagram domains
- **Open Source**: Full source code available for review

## Development

### Building from Source

1. Clone the repository
2. Make your changes
3. Load as unpacked extension in Chrome
4. Test on Instagram

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Common Issues

**Ghost Mode not working**
- Ensure the extension is enabled
- Check that you're on an Instagram page
- Try refreshing the Instagram page

**Extension not loading**
- Verify Developer mode is enabled
- Check for any console errors
- Ensure all files are present

### Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the technical documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is for educational and privacy purposes. Use responsibly and in accordance with Instagram's Terms of Service. The developers are not responsible for any consequences of using this extension. 