# 自定义 API 配置

openwork 现在支持配置自定义的 OpenAI 兼容 API 端点，让你可以使用任何兼容 OpenAI API 格式的服务。

## 功能特性

- 支持自定义 Base URL
- 支持自定义 API Key
- 可选配置模型名称
- 与官方 API 配置一样安全地存储在本地

## 如何配置

### 方式 1: 通过快速配置对话框（推荐）

1. 打开 openwork
2. 在模型选择器中点击 "Custom API" 旁边的钥匙图标
3. 在弹出的对话框中填写：
   - **Base URL**: 你的 API 端点地址（例如：`https://api.example.com/v1`）
   - **API Key**: 你的 API 密钥
   - **Model Name** (可选): 模型名称（例如：`gpt-4`, `claude-3-opus` 等）
4. 点击 "Save"

### 方式 2: 通过设置界面

1. 打开 openwork
2. 点击设置按钮
3. 滚动到 "Custom API" 部分
4. 填写相同的信息
5. 点击 "Save Custom API"

### 方式 3: 通过环境变量

在 `~/.openwork/.env` 文件中添加：

```bash
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_API_KEY=your-api-key-here
CUSTOM_MODEL=your-model-name  # 可选
```

## 使用自定义 API

配置完成后：

1. 在模型选择器中会出现 "Custom API" 选项
2. 选择该选项后，所有请求将发送到你配置的自定义端点
3. 如果配置了模型名称，将使用该名称；否则使用 "custom" 作为模型标识

## 兼容性

自定义 API 功能使用 OpenAI 客户端，因此你的 API 端点需要：

- 兼容 OpenAI API 格式
- 支持 Chat Completions API
- 支持流式响应（streaming）

常见的兼容服务包括：
- OpenAI 官方 API
- Azure OpenAI
- 本地部署的 LLM（如 vLLM, Text Generation WebUI）
- 其他 OpenAI 兼容的 API 服务

## 安全性

- API 密钥存储在本地 `~/.openwork/.env` 文件中
- 不会上传到任何服务器
- 与官方 API 密钥使用相同的安全机制

## 故障排除

如果自定义 API 无法工作：

1. 检查 Base URL 格式是否正确（应该以 `https://` 开头）
2. 确认 API Key 是否有效
3. 验证 API 端点是否兼容 OpenAI 格式
4. 查看控制台日志获取详细错误信息
