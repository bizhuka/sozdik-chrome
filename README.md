# Sozdik.kz Chrome Extension

This Chrome extension provides integration with Sozdik.kz, a Kazakh-Russian dictionary service.

## Extension Permissions

The extension requires the following permissions to function properly:

| Permission | Purpose |
|------------|---------|
| `scripting` | Required to execute scripts in tabs (for ChatGPT interaction) |
| `tabs` | Required to create and manage tabs when opening dictionary lookups |
| `activeTab` | Required to access the currently active tab for text selection |
| `storage` | Required to store user preferences and settings |
| `contextMenus` | Required for the right-click dictionary lookup feature |
| `downloads` | Required to download history as CSV |


## Host Permissions

The extension requires access to:

- `https://sozdik.kz/` - To access the dictionary service
- `https://chatgpt.com/` - For translation and morphological analysis features


## Privacy Policy
This extension does not collect, store, or share any user data