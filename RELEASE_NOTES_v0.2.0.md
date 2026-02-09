# Release Notes - v0.2.0

## 🎉 Multiple Custom API Providers Support

This release adds the ability to configure **unlimited custom OpenAI-compatible API providers** directly from the UI!

## ✨ New Features

### 1. Add Multiple Custom Providers

- Click the **"+ 添加Provider"** button at the bottom of the provider list in the model selector
- Each provider can have its own:
  - Unique ID (e.g., `moonshot`, `zhipu`, `deepseek`)
  - Display name (e.g., `Moonshot AI`, `Zhipu AI`)
  - Base URL (e.g., `https://api.moonshot.cn/v1`)
  - API Key
  - Model name (e.g., `kimi-k2-turbo-preview`)

### 2. Improved User Experience

- One-click provider addition - no need to edit config files
- Providers appear immediately after saving
- Each provider displays with its custom name in the UI
- Models display with their actual names (not generic "custom-xxx")

### 3. Perfect for Chinese AI Providers

Works seamlessly with:

- **Moonshot AI (Kimi)**: `https://api.moonshot.cn/v1`
- **Zhipu AI (GLM)**: `https://open.bigmodel.cn/api/paas/v4`
- **DeepSeek**: `https://api.deepseek.com/v1`
- **Baichuan AI**, **MiniMax**, and more!

### 4. Simplified Settings

- Settings dialog now focuses on standard providers (Anthropic, OpenAI, Google)
- Custom provider management moved to the model selector for better UX
- Cleaner, more intuitive interface

## 🔧 Technical Changes

- Refactored storage layer to support multiple custom API configurations
- Dynamic provider type system (no longer limited to fixed provider IDs)
- Each custom config stored with unique ID in `~/.openwork/.env`
- Automatic provider list refresh after adding new providers

## 📦 Publishing to npm

To publish this version:

```bash
# Make sure you're logged in to npm
npm login

# Publish the package
npm publish --access public
```

## 🚀 Upgrade Instructions

For users upgrading from v0.1.0:

- Your existing custom API configuration will continue to work
- To add more providers, use the new "+ 添加Provider" button in the model selector
- No breaking changes - fully backward compatible

## 🐛 Bug Fixes

- Fixed provider type definitions to support dynamic custom providers
- Improved error handling in custom API configuration
- Better validation for provider IDs and configuration fields

## 📝 Documentation

- Updated README with comprehensive custom provider guide
- Added example configurations for popular Chinese AI providers
- Included step-by-step instructions for adding custom providers

---

**Full Changelog**: https://github.com/uniqueli/openwork/compare/v0.1.0...v0.2.0
