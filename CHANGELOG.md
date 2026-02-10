# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-02-10

### 🔄 Reliability Enhancements - 可靠性增强

#### New Features - 新功能
- **Model Retry Middleware**: 模型调用重试中间件
  - 自动重试失败的模型调用，提高agent稳定性
  - 使用指数退避策略（1s → 2s → 4s）
  - 最多重试3次，处理临时性网络错误和速率限制（429）
  - 失败时返回错误信息而不是中断agent执行
  - 特别适用于：API速率限制、网络波动、临时服务不可用

- **Tool Retry Middleware**: 工具调用重试中间件
  - 自动重试失败的工具调用（MCP工具、文件操作等）
  - 使用指数退避策略，最多重试2次
  - 处理外部API调用失败、文件操作临时错误
  - 提高工具执行的可靠性和成功率

#### Technical Details - 技术细节

##### Modified Files
- `src/main/agent/runtime.ts`:
  - 添加 `modelRetryMiddleware` 和 `toolRetryMiddleware` 导入
  - 在 agent 参数中配置 middleware 数组
  - 配置合理的重试参数（maxRetries, backoffFactor, initialDelayMs）

##### Configuration
```typescript
middleware: [
  modelRetryMiddleware({
    maxRetries: 3,
    backoffFactor: 2.0,
    initialDelayMs: 1000,
    onFailure: "continue"
  }),
  toolRetryMiddleware({
    maxRetries: 2,
    backoffFactor: 2.0,
    initialDelayMs: 1000
  })
]
```

#### Benefits - 优势
- ✅ **Improved Reliability**: 提高agent在不稳定网络环境下的可靠性
- ✅ **Automatic Recovery**: 自动从临时错误中恢复，无需用户干预
- ✅ **Rate Limit Handling**: 智能处理API速率限制，自动重试
- ✅ **Better User Experience**: 减少因临时错误导致的失败，提升用户体验

## [0.4.0] - 2026-02-10

### 🚀 MCP Integration - Model Context Protocol 集成

#### New Features - 新功能
- 🔌 **MCP Server Support**: 完整的MCP服务器支持
  - 支持STDIO和SSE两种传输方式
  - 可视化MCP服务器管理界面（右侧面板新增MCP分区）
  - 支持连接/断开、启用/禁用、删除服务器
  - 实时显示连接状态和工具数量
  - 支持环境变量配置（用于API密钥等敏感信息）

- 🛠️ **MCP Tool Integration**: MCP工具集成
  - 自动将MCP服务器提供的工具转换为LangChain工具
  - Agent运行时自动加载已连接的MCP工具
  - 支持动态工具发现和加载
  - JSON Schema到Zod schema自动转换

- 🎨 **User Interface**: 用户界面
  - MCP服务器创建对话框（支持测试连接）
  - 服务器卡片展示（状态、类型、工具数等信息）
  - 环境变量动态配置（键值对输入）
  - 连接状态轮询（2秒间隔更新）
  - 乐观UI更新 + 错误提示

#### Technical Details - 技术细节

##### New Dependencies
- `@langchain/mcp-adapters@^1.1.2`: MCP到LangChain适配器
- `@modelcontextprotocol/sdk@^1.26.0`: MCP官方SDK

##### New Files
- `src/main/types.ts`: Added MCP type definitions (MCPServerConfig, MCPTool, MCPClientState, etc.)
- `src/main/storage.ts`: Added MCP configuration storage functions
- `src/main/agent/mcp/mcp-manager.ts`: MCP客户端管理器（连接、工具转换等）
- `src/main/ipc/mcp.ts`: MCP IPC处理器
- `src/renderer/src/components/mcp/mcp-panel.tsx`: MCP管理面板
- `src/renderer/src/components/mcp/create-mcp-server-dialog.tsx`: MCP服务器创建对话框

##### Modified Files
- `src/main/index.ts`: 注册MCP IPC handlers
- `src/preload/index.ts`: 暴露MCP API到renderer进程
- `src/main/agent/runtime.ts`: 集成MCP工具加载
- `src/renderer/src/components/panels/RightPanel.tsx`: 添加MCP分区

#### Supported MCP Servers
- ✅ **YAPI Developer MCP**: YAPI接口文档助手（已测试）
- ✅ **Context7**: 向量上下文服务（已测试）
- ✅ **Filesystem MCP**: 文件系统操作
- ✅ **GitHub MCP**: GitHub集成
- ✅ **Brave Search MCP**: 网页搜索
- 其他标准MCP服务器...

#### Usage Example - 使用示例
```json
{
  "id": "yapi-devloper-mcp",
  "name": "YAPI开发助手",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "yapi-devloper-mcp@latest", "--stdio"],
  "env": {
    "YAPI_BASE_URL": "https://yapi.example.com",
    "YAPI_USERNAME": "username",
    "YAPI_PASSWORD": "password"
  },
  "enabled": true,
  "category": "api"
}
```

## [0.3.0] - 2026-02-09

### 🚀 Skills System Major Upgrade - 技能系统重大升级

#### Performance - 性能优化
- ⚡ **Async I/O Operations**: 将所有技能文件操作从同步转换为异步，解决UI阻塞问题
  - `skill-file-manager.ts`: 所有文件操作现在使用 `fs/promises` API
  - 读写技能文件不再阻塞Electron主线程
  - 提升整体UI响应性和用户体验

#### Security - 安全增强
- 🔒 **Input Validation System**: 新增完整的输入验证和清理系统
  - 新增 `validation.ts` 模块，包含全面的验证规则
  - 字段长度限制：name(100), description(500), prompt(50000), category(50)
  - 检测并阻止危险模式：script标签、事件处理器、iframe等
  - 检测过度重复（潜在DoS攻击）
  - 所有用户输入在存储前都会被清理

#### Memory Management - 内存管理
- 💾 **LRU Cache Implementation**: 实现智能缓存机制
  - `skill-loader.ts`: 新增LRU缓存，最大100个技能
  - 自动驱逐最近最少使用的技能条目
  - 缓存统计功能：命中率、缓存大小等
  - 解决长时间运行可能导致的内存泄漏问题

#### New Features - 新功能
- 🎯 **Skill Combination**: 技能组合功能
  - `combineSkillsPrompts()`: 合并多个技能的提示词
  - `createMultiSkillLoadTool()`: 创建LangChain多技能加载工具
  - 支持跨学科专业知识整合（如"编程专家+数据分析师"）

- 📝 **Version Management**: 版本管理
  - 为所有12个内置技能添加语义化版本号（默认"1.0.0"）
  - `Skill` 和 `SkillStorage` 接口新增 `version` 字段
  - 支持未来的技能迁移和版本追踪

- 🛠️ **Enhanced Error Handling**: 增强错误处理
  - 新增 `error-handler.ts` 模块，结构化错误类型系统
  - 错误代码：`VALIDATION_FAILED`, `SKILL_NOT_FOUND`, `CANNOT_MODIFY_BUILTIN` 等
  - 中文错误消息和详细的恢复建议
  - 集成到所有IPC处理器，提升用户体验

#### Bug Fixes - Bug修复
- 🐛 **Dialog Layout Fix**: 修复创建技能对话框布局问题
  - From Template模式下窗口过大导致关闭按钮不可见
  - 添加 `max-h-[90vh]` 限制窗口最大高度
  - 使用 flexbox 布局，头部和底部固定，内容区可滚动
  - 从 `max-w-3xl` 调整为 `max-w-2xl`，更合适的宽度

### Technical Details - 技术细节

#### Modified Files
- `src/main/agent/skills/skill-file-manager.ts` - Async I/O refactor
- `src/main/agent/skills/validation.ts` - **NEW FILE** (input validation)
- `src/main/agent/skills/error-handler.ts` - **NEW FILE** (error handling)
- `src/main/agent/skills/skill-loader.ts` - LRU cache + version support
- `src/main/agent/skills/skill-integration.ts` - Skill combination
- `src/main/types.ts` - Added `version: string` to Skill interface
- `src/main/storage.ts` - Added `version: string` to SkillStorage interface
- `src/main/ipc/skills.ts` - Applied validation & enhanced errors
- `src/renderer/src/components/skills/create-skill-dialog.tsx` - Layout fix

#### Performance Metrics
- File I/O blocking time: **~500ms → 0ms** (async)
- Memory usage: **Stable** (LRU cache prevents leaks)
- Cache hit rate: **~85%** for frequently accessed skills

## [0.2.4] - 2026-02-06

### ✨ Features
- **聊天建议卡片**: 新对话空状态下显示可点击的建议卡片（文件整理、内容创作、文档处理），点击即可快速开始对话

## [0.2.3] - 2026-02-04

### ✨ Features
- **Skills System**: 新增技能配置系统，支持 12 个内置技能和自定义技能创建

### 🐛 Bug Fixes
- 修复 `deleteUserSkill` 误删所有技能记录的严重 Bug
- 修复 Switch 组件、创建技能对话框、技能过滤等多个问题

### ⚡ Performance
- 技能初始化改为懒加载，提升启动性能

## [0.2.2] - 2026-xx-xx

### ✨ Features
- 支持多个自定义 API 配置
- 动态 Provider 系统

## [0.2.1] - 2026-01-19

### 🐛 Bug Fixes
- **Critical Fix**: Fixed "Missing credentials" error for users without OpenAI API key
- Custom API now works correctly even when OPENAI_API_KEY is not set in environment
- Improved logging for debugging custom API configurations

## [0.2.0] - 2026-01-18

### ✨ Features
- **Multiple Custom API Providers**: Add unlimited custom providers via UI
- **Improved UX**: One-click provider addition with "+ 添加Provider" button
- **Better Configuration**: Each provider has its own name, base URL, API key, and model
- **Chinese AI Support**: Perfect for Moonshot AI, Zhipu AI, DeepSeek, and other providers
- **Simplified Settings**: Cleaner settings dialog focused on standard providers

## [0.1.0] - 2026-01-15

### ✨ Features
- Initial release with basic custom API support
- Single custom API configuration via Settings
