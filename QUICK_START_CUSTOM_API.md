# 快速开始 - 自定义 API 配置

## 5 分钟配置指南

### 步骤 1: 启动应用

```bash
cd openwork
npm install
npm run dev
```

### 步骤 2: 配置自定义 API

#### 方法 A: 快速配置（推荐）⚡

1. 在应用界面找到模型选择器
2. 找到 "Custom API" 选项
3. 点击旁边的 🔑 钥匙图标
4. 在弹出的对话框中填写：

```
Base URL: https://api.openai.com/v1
API Key: sk-your-api-key-here
Model Name: gpt-4  (可选)
```

5. 点击 **Save**

#### 方法 B: 完整设置

1. 点击应用右上角的 ⚙️ 设置按钮
2. 滚动到 "Custom API" 部分
3. 填写相同的信息
4. 点击 **Save Custom API**

### 步骤 3: 使用自定义 API

1. 在模型选择器中选择 "Custom API"
2. 创建新对话或在现有对话中发送消息
3. 开始使用！

## 常见配置示例

### OpenAI 官方 API

```
Base URL: https://api.openai.com/v1
API Key: sk-...
Model Name: gpt-4
```

### Azure OpenAI

```
Base URL: https://your-resource.openai.azure.com/openai/deployments/your-deployment
API Key: your-azure-key
Model Name: gpt-4
```

### 本地 vLLM

```
Base URL: http://localhost:8000/v1
API Key: any-string
Model Name: your-model-name
```

### Ollama (OpenAI 兼容模式)

```
Base URL: http://localhost:11434/v1
API Key: ollama
Model Name: llama2
```

## 验证配置

### 检查配置文件

```bash
cat ~/.openwork/.env
```

应该看到：

```
CUSTOM_BASE_URL=https://api.openai.com/v1
CUSTOM_API_KEY=sk-...
CUSTOM_MODEL=gpt-4
```

### 检查日志

打开开发者工具（Cmd/Ctrl + Shift + I），在控制台中应该看到：

```
[Runtime] Using model: custom
[Runtime] Custom API config present: true
```

## 故障排除

### 问题: 保存按钮是灰色的

**原因**: Base URL 或 API Key 为空  
**解决**: 确保两个必填字段都已填写

### 问题: 配置保存后不生效

**原因**: 可能需要重启应用  
**解决**: 关闭并重新打开应用

### 问题: 请求失败

**检查清单**:

- [ ] Base URL 格式正确（包含 `/v1` 后缀）
- [ ] API Key 有效
- [ ] 端点可访问（如果是本地服务，确保已启动）
- [ ] 端点兼容 OpenAI API 格式

### 问题: 找不到 Custom API 选项

**原因**: 可能需要重新构建  
**解决**:

```bash
npm run build
npm run dev
```

## 高级用法

### 使用环境变量

直接编辑配置文件：

```bash
nano ~/.openwork/.env
```

添加：

```bash
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_API_KEY=your-key
CUSTOM_MODEL=your-model
```

### 切换不同的端点

1. 打开配置对话框
2. 修改 Base URL
3. 保存
4. 无需重启即可生效

### 删除配置

1. 打开配置对话框
2. 点击 **Remove Key** 按钮
3. 确认删除

## 安全提示

⚠️ **重要**:

- 不要分享你的 API Key
- 不要将 `.env` 文件提交到版本控制
- 定期更换 API Key
- 使用 HTTPS 端点（推荐）

## 获取帮助

- 📖 详细文档: [CUSTOM_API.md](CUSTOM_API.md)
- 🔧 实现细节: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- ✅ 测试清单: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- 🐛 问题反馈: [GitHub Issues](https://github.com/langchain-ai/openwork/issues)

## 下一步

配置完成后，你可以：

- 选择 Custom API 模型
- 创建新的对话
- 使用所有 openwork 功能
- 享受自定义 API 的灵活性！

---

**提示**: 如果你使用的是本地模型服务，确保服务已启动并监听正确的端口。
