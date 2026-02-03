# @uniqueli/openwork

[![npm][npm-badge]][npm-url] [![License: MIT][license-badge]][license-url]

[npm-badge]: https://img.shields.io/npm/v/@uniqueli/openwork.svg
[npm-url]: https://www.npmjs.com/package/@uniqueli/openwork
[license-badge]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://opensource.org/licenses/MIT

A desktop interface for [deepagentsjs](https://github.com/langchain-ai/deepagentsjs) — an opinionated harness for building deep agents with filesystem capabilities, planning, and subagent delegation.

**✨ Enhanced with Multiple Custom API Support** - Add unlimited OpenAI-compatible API providers with a single click!

![openwork screenshot](docs/screenshot.png)

> [!CAUTION]
> openwork gives AI agents direct access to your filesystem and the ability to execute shell commands. Always review tool calls before approving them, and only run in workspaces you trust.

## Get Started

```bash
# Run directly with npx
npx @uniqueli/openwork

# Or install globally
npm install -g @uniqueli/openwork
openwork
```

Requires Node.js 18+.

### From Source

```bash
git clone https://github.com/langchain-ai/openwork.git
cd openwork
npm install
npm run dev
```

Or configure them in-app via the settings panel.

## Supported Models

| Provider  | Models                                                                                 |
| --------- | -------------------------------------------------------------------------------------- |
| Anthropic | Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.1, Claude Sonnet 4 |
| OpenAI    | GPT-5.2, GPT-5.1, o3, o3 Mini, o4 Mini, o1, GPT-4.1, GPT-4o                            |
| Google    | Gemini 3 Pro Preview, Gemini 3 Flash Preview, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite |
| **Custom**    | **Add unlimited custom providers!**                                |

## ✨ Multiple Custom API Providers

**New in v0.2.0**: Add multiple custom OpenAI-compatible API providers directly from the UI!

### How to Add Custom Providers

1. Click the model selector in the chat interface
2. Click the **"+ 添加Provider"** button at the bottom of the provider list
3. Fill in the form:
   - **ID**: Unique identifier (e.g., `moonshot`, `zhipu`, `deepseek`)
   - **Display Name**: Name shown in UI (e.g., `Moonshot AI`, `Zhipu AI`)
   - **Base URL**: API endpoint (e.g., `https://api.moonshot.cn/v1`)
   - **API Key**: Your API key
   - **Model Name**: Model identifier (e.g., `kimi-k2-turbo-preview`)
4. Click **Save** - your new provider appears immediately!

### Supported Custom APIs

Works with any OpenAI-compatible API:
- **Chinese AI Providers**: Moonshot AI (Kimi), Zhipu AI (GLM), DeepSeek, Baichuan, etc.
- **Self-hosted models**: vLLM, Text Generation WebUI, LocalAI, Ollama (with OpenAI compatibility)
- **Cloud services**: Azure OpenAI, AWS Bedrock (with proxy), Cloudflare AI
- **Other providers**: Together AI, Anyscale, Fireworks AI, etc.

### Example Configurations

**Moonshot AI (Kimi)**
```
ID: moonshot
Display Name: Moonshot AI
Base URL: https://api.moonshot.cn/v1
Model Name: kimi-k2-turbo-preview
```

**Zhipu AI (GLM)**
```
ID: zhipu
Display Name: Zhipu AI
Base URL: https://open.bigmodel.cn/api/paas/v4
Model Name: glm-4-plus
```

**DeepSeek**
```
ID: deepseek
Display Name: DeepSeek
Base URL: https://api.deepseek.com/v1
Model Name: deepseek-chat
```
Configure via Settings UI or by setting environment variables:
```bash
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_API_KEY=your-api-key
CUSTOM_MODEL=your-model-name  # optional
```

## Changelog

### v0.2.1 (2026-01-19)
- 🐛 **Critical Fix**: Fixed "Missing credentials" error for users without OpenAI API key
- 🔧 Custom API now works correctly even when OPENAI_API_KEY is not set in environment
- 📝 Improved logging for debugging custom API configurations

### v0.2.0 (2026-01-18)
- ✨ **Multiple Custom API Providers**: Add unlimited custom providers via UI
- 🎨 **Improved UX**: One-click provider addition with "+ 添加Provider" button
- 🔧 **Better Configuration**: Each provider has its own name, base URL, API key, and model
- 🌐 **Chinese AI Support**: Perfect for Moonshot AI, Zhipu AI, DeepSeek, and other providers
- 📝 **Simplified Settings**: Cleaner settings dialog focused on standard providers

### v0.1.0 (2026-01-15)
- 🎉 Initial release with basic custom API support
- 🔑 Single custom API configuration via Settings

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Report bugs via [GitHub Issues](https://github.com/uniqueli/openwork/issues).

## Credits

This project is a fork of [openwork by LangChain](https://github.com/langchain-ai/openwork) with enhanced custom API support.

## License

MIT — see [LICENSE](LICENSE) for details.
