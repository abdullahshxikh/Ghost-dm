# Ghost DM Release Checklist

## File Validation & Wiring

### Core Extension Files
- [x] `manifest.json` - Manifest V3 compliant, all permissions declared
- [x] `background.js` - Service worker, handles ruleset management
- [x] `popup.html` - Modern UI with toggle switch
- [x] `popup.js` - Storage management and background communication
- [x] `content.js` - Toast notifications on Instagram
- [x] `early-inject.js` - Early injection script for timing
- [x] `styles.css` - Dark theme soft UI styling
- [x] `rules.json` - Declarative net request rules for blocking
- [x] `icon.png` - 128x128 extension icon

### Documentation Files
- [x] `README.md` - Comprehensive project documentation
- [x] `store-listing.md` - Chrome Web Store listing content
- [x] `RELEASE_CHECKLIST.md` - This checklist

## Pre-Submission Testing Checklist

### Basic Functionality
- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Popup opens when clicking extension icon
- [ ] Toggle switch works (changes from white to green)
- [ ] Status text updates correctly
- [ ] Settings persist across browser restarts

### Instagram Integration
- [ ] Content script injects on Instagram pages
- [ ] Toast notifications appear when Ghost Mode changes
- [ ] No console errors on Instagram.com
- [ ] Extension works on both www.instagram.com and i.instagram.com

### Request Blocking
- [ ] Read receipt requests are blocked when Ghost Mode ON
- [ ] Read receipt requests are allowed when Ghost Mode OFF
- [ ] Normal Instagram functionality unaffected (posting, browsing, etc.)
- [ ] Can still receive messages and notifications

### Cross-Browser Testing
- [ ] Works in Chrome (latest version)
- [ ] Works in Chrome (version 88+ for Manifest V3 support)
- [ ] No errors in incognito mode
- [ ] Extension icon appears correctly in toolbar

### Performance Testing
- [ ] No memory leaks after extended use
- [ ] Fast popup response time (<100ms)
- [ ] No impact on Instagram page load speed
- [ ] Background script doesn't consume excessive CPU

## Store Compliance Checklist

### Content Policy Compliance
- [ ] No misleading functionality claims
- [ ] Clear value proposition in description
- [ ] Accurate permission usage explanations
- [ ] No copyright violations in text/images
- [ ] Professional, user-friendly interface

### Technical Requirements
- [ ] Manifest V3 format
- [ ] No deprecated APIs used
- [ ] All permissions justified and minimal
- [ ] No external code dependencies
- [ ] Code follows Chrome extension best practices

### Privacy Requirements
- [ ] Privacy policy clearly states "no data collection"
- [ ] No analytics or tracking code
- [ ] No external network requests
- [ ] Only local storage used for preferences
- [ ] Transparent about Instagram API interaction

### Security Requirements
- [ ] No use of eval() or unsafe code execution
- [ ] Content Security Policy compliant
- [ ] No inline scripts in HTML files
- [ ] All external resources properly declared
- [ ] No sensitive data exposure

## Final ZIP Export Process

### Files to Include
```
ghost-dm-v1.0.0.zip
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── content.js
├── early-inject.js
├── styles.css
├── rules.json
└── icon.png
```

### Files to Exclude
- All test files and debugging scripts
- Documentation files (README.md, etc.)
- Development notes and guides

### ZIP Creation Steps
1. Create a clean directory with only production files
2. Verify all files are present and correct
3. Create ZIP archive with descriptive filename
4. Test ZIP by loading as unpacked extension
5. Verify all functionality works from ZIP

## Store Submission Checklist

### Required Information
- [ ] Extension name and description
- [ ] Privacy policy URL
- [ ] Support contact information
- [ ] Screenshots of extension in action
- [ ] Detailed feature list
- [ ] Installation instructions

### Store Listing Content
- [ ] Professional description without emojis
- [ ] Clear feature benefits
- [ ] Accurate technical details
- [ ] Appropriate tags and categories
- [ ] Privacy policy compliance

### Final Verification
- [ ] Extension passes all automated checks
- [ ] No policy violations detected
- [ ] All required fields completed
- [ ] Screenshots meet store requirements
- [ ] Ready for manual review 