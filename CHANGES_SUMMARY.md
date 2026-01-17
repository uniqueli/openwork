# 自定义 API 配置功能 - 修改总结

## 概述

为 openwork 项目添加了自定义 API 配置功能，允许用户配置自己的 OpenAI 兼容 API 端点，包括自定义 Base URL 和 API Key。

## 修改的文件

### 1. 类型定义

#### `src/main/types.ts`
- 添加 `'custom'` 到 `ProviderId` 类型
- 添加 `CustomApiConfig` 接口定义

#### `src/renderer/src/types.ts`
- 同步添加 `'custom'` 到 `ProviderId` 类型
- 添加 `CustomApiConfig` 接口定义

### 2. 存储层 (Storage)

#### `src/main/storage.ts`
- 添加 `CustomApiConfig` 接口
- 添加 `getCustomApiConfig()` 函数 - 获取自定义 API 配置
- 添加 `setCustomApiConfig()` 函数 - 保存自定义 API 配置
- 添加 `deleteCustomApiConfig()` 函数 - 删除自定义 API 配置
- 添加 `hasCustomApiConfig()` 函数 - 检查是否配置了自定义 API
- 更新 `ENV_VAR_NAMES` 添加 `custom: 'CUSTOM_API_KEY'`

配置存储在 `~/.openwork/.env` 文件中：
- `CUSTOM_BASE_URL` - API 端点地址
- `CUSTOM_API_KEY` - API 密钥
- `CUSTOM_MODEL` - 模型名称（可选）

### 3. IPC 层 (Main Process)

#### `src/main/ipc/models.ts`
- 导入新的存储函数
- 添加 `'custom'` 到 `PROVIDERS` 数组
- 添加 `models:getCustomApiConfig` IPC 处理器
- 添加 `models:setCustomApiConfig` IPC 处理器
- 添加 `models:deleteCustomApiConfig` IPC 处理器
- 更新 `models:listProviders` 处理器，支持检查自定义 API 配置状态
- 添加 "Custom API" 模型到 `AVAILABLE_MODELS` 列表
- 更新 `models:list` 处理器，根据自定义配置状态显示可用性

### 4. Agent Runtime

#### `src/main/agent/runtime.ts`
- 导入 `getCustomApiConfig` 函数
- 更新 `getModelInstance()` 函数，添加自定义 API 支持
- 当模型 ID 为 'custom' 或以 'custom-' 开头时，使用自定义配置
- 使用 OpenAI 客户端配合自定义 Base URL 和 API Key

### 5. Preload 层

#### `src/preload/index.ts`
- 添加 `getCustomApiConfig` IPC 方法
- 添加 `setCustomApiConfig` IPC 方法
- 添加 `deleteCustomApiConfig` IPC 方法

### 6. UI 层 (Renderer)

#### `src/renderer/src/components/settings/SettingsDialog.tsx`
- 添加 `CustomConfig` 接口定义
- 添加自定义配置相关的状态管理
- 添加 `handleCustomConfigChange()` 函数 - 处理配置输入变化
- 添加 `saveCustomConfig()` 函数 - 保存自定义配置
- 添加 `deleteCustomConfig()` 函数 - 删除自定义配置
- 更新 `loadApiKeys()` 函数，加载自定义 API 配置
- 添加自定义 API 配置 UI 部分：
  - Base URL 输入框
  - API Key 输入框（带显示/隐藏切换）
  - Model Name 输入框（可选）
  - 保存和删除按钮
  - 配置状态指示器

### 7. 文档

#### `README.md`
- 更新支持的模型表格，添加 Custom 行
- 添加自定义 API 配置说明
- 添加环境变量配置示例
- 添加指向详细文档的链接

#### `CUSTOM_API.md` (新文件)
- 详细的自定义 API 配置指南
- 配置方式说明（UI 和环境变量）
- 使用说明
- 兼容性要求
- 安全性说明
- 故障排除指南

## 功能特性

1. **灵活配置**: 支持通过 UI 或环境变量配置
2. **安全存储**: 配置存储在本地 `~/.openwork/.env` 文件中
3. **OpenAI 兼容**: 使用 OpenAI 客户端，兼容所有 OpenAI API 格式的服务
4. **可选模型名**: 支持自定义模型名称，也可以使用默认值
5. **状态指示**: UI 显示配置状态（已配置/未保存/未设置）
6. **密钥保护**: API Key 输入框支持显示/隐藏切换

## 使用场景

- 使用自托管的 LLM 服务（vLLM, Text Generation WebUI 等）
- 使用 Azure OpenAI 服务
- 使用其他 OpenAI 兼容的 API 服务
- 使用代理或中转服务

## 技术实现

1. **存储**: 使用与官方 API Key 相同的 `.env` 文件存储机制
2. **客户端**: 使用 `@langchain/openai` 的 `ChatOpenAI` 类，配置自定义 `baseURL`
3. **类型安全**: 完整的 TypeScript 类型定义
4. **IPC 通信**: 标准的 Electron IPC 模式，主进程和渲染进程分离

## 测试建议

1. 通过 UI 配置自定义 API
2. 验证配置保存到 `~/.openwork/.env`
3. 选择 "Custom API" 模型
4. 发送测试消息，验证请求发送到自定义端点
5. 测试删除配置功能
6. 测试通过环境变量配置
