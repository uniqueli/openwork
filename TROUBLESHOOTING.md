# 故障排除指南

## 问题：配置了 Custom API 但还是报错 "Anthropic API key not configured"

### 原因
你配置了 Custom API，但是**选择的模型还是 Claude 或其他官方模型**，而不是 Custom API 模型。

### 解决方案

#### 步骤 1: 确认已配置 Custom API
```bash
cat ~/.openwork/.env
```

应该看到：
```
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_API_KEY=your-api-key
CUSTOM_MODEL=your-model  # 可选
```

#### 步骤 2: 在 UI 中选择 Custom API 模型

1. 找到模型选择器（通常在聊天界面顶部）
2. 点击当前模型名称（例如 "claude-sonnet-4-5-20250929"）
3. 在弹出的菜单中：
   - 左侧选择 **"Custom API"** provider
   - 右侧会显示 "custom" 模型
   - 点击 **"custom"** 模型
4. 现在模型选择器应该显示 "custom"

#### 步骤 3: 发送消息测试

发送一条测试消息，检查控制台日志：

**正确的日志**:
```
[Runtime] Using model: custom
[Runtime] Custom API config present: true
```

**错误的日志**（说明还在使用 Claude）:
```
[Runtime] Using model: claude-sonnet-4-5-20250929
[Runtime] Anthropic API key present: false
```

### 视觉指南

#### 错误状态（选择了 Claude）
```
┌─────────────────────────────────────┐
│ 🤖 claude-sonnet-4-5-20250929  ▼   │  ← 这是错误的！
└─────────────────────────────────────┘
```

#### 正确状态（选择了 Custom API）
```
┌─────────────────────────────────────┐
│ 📦 custom  ▼                        │  ← 这是正确的！
└─────────────────────────────────────┘
```

## 问题：找不到 Custom API 选项

### 原因
可能需要重新构建应用以加载最新代码。

### 解决方案

```bash
# 停止当前运行的应用
# 然后重新构建
npm run build
npm run dev
```

重启后，在模型选择器的 Provider 列表中应该能看到 "Custom API"。

## 问题：Custom API 显示为不可用（灰色）

### 原因
Custom API 配置不完整或未保存。

### 解决方案

1. 点击 Custom API 旁边的 🔑 图标
2. 确保填写了：
   - Base URL（必填）
   - API Key（必填）
3. 点击 Save
4. 刷新模型列表

## 问题：保存配置后仍然不可用

### 检查清单

1. **验证配置文件**
   ```bash
   cat ~/.openwork/.env | grep CUSTOM
   ```
   应该看到三个环境变量

2. **重启应用**
   完全关闭应用，然后重新启动

3. **检查权限**
   ```bash
   ls -la ~/.openwork/.env
   ```
   确保文件可读写

4. **手动测试配置**
   ```bash
   curl -X POST https://your-base-url/chat/completions \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"model":"your-model","messages":[{"role":"user","content":"test"}]}'
   ```

## 问题：请求发送到错误的端点

### 检查日志

打开开发者工具（Cmd/Ctrl + Shift + I），查看：

1. **Console 标签页**
   ```
   [Runtime] Using model: custom
   [Runtime] Custom API config present: true
   ```

2. **Network 标签页**
   - 查找 POST 请求
   - 验证请求 URL 是否是你配置的 Base URL
   - 检查 Authorization header

## 问题：配置保存但无法加载

### 可能的原因

1. **配置文件格式错误**
   ```bash
   # 检查是否有语法错误
   cat ~/.openwork/.env
   ```
   
   正确格式：
   ```
   CUSTOM_BASE_URL=https://api.example.com/v1
   CUSTOM_API_KEY=sk-xxx
   CUSTOM_MODEL=gpt-4
   ```
   
   错误格式（不要有引号或空格）：
   ```
   CUSTOM_BASE_URL = "https://api.example.com/v1"  ❌
   CUSTOM_API_KEY="sk-xxx"  ❌
   ```

2. **文件编码问题**
   确保文件是 UTF-8 编码

3. **权限问题**
   ```bash
   chmod 600 ~/.openwork/.env
   ```

## 问题：模型选择器不显示 custom 模型

### 解决方案

1. **确认配置已保存**
   - 打开配置对话框
   - 查看状态是否显示 "Configured"

2. **刷新模型列表**
   - 关闭并重新打开模型选择器
   - 或重启应用

3. **检查后端日志**
   ```
   [Runtime] Custom API config present: true
   ```

## 问题：API 请求失败

### 常见错误

#### 1. 401 Unauthorized
**原因**: API Key 无效或格式错误  
**解决**: 
- 检查 API Key 是否正确
- 确认 API Key 有效期
- 验证 API Key 权限

#### 2. 404 Not Found
**原因**: Base URL 不正确  
**解决**:
- 检查 Base URL 格式
- 确认包含正确的路径（通常是 `/v1`）
- 测试端点是否可访问

#### 3. 500 Internal Server Error
**原因**: 服务器端问题  
**解决**:
- 检查自定义 API 服务是否正常运行
- 查看服务器日志
- 验证请求格式是否兼容

#### 4. CORS Error
**原因**: 跨域问题（通常不会发生在 Electron 应用中）  
**解决**:
- 确认使用的是 Electron 应用而不是浏览器
- 检查自定义 API 的 CORS 配置

## 调试技巧

### 1. 启用详细日志

打开开发者工具（Cmd/Ctrl + Shift + I），查看：
- Console: 应用日志
- Network: 网络请求
- Application > Local Storage: 本地存储

### 2. 测试配置

创建一个简单的测试脚本：

```bash
#!/bin/bash
# test-custom-api.sh

BASE_URL=$(grep CUSTOM_BASE_URL ~/.openwork/.env | cut -d= -f2)
API_KEY=$(grep CUSTOM_API_KEY ~/.openwork/.env | cut -d= -f2)
MODEL=$(grep CUSTOM_MODEL ~/.openwork/.env | cut -d= -f2)

echo "Testing Custom API Configuration"
echo "Base URL: $BASE_URL"
echo "Model: $MODEL"

curl -X POST "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"stream\":false}"
```

运行：
```bash
chmod +x test-custom-api.sh
./test-custom-api.sh
```

### 3. 比对配置

确认所有配置一致：

```bash
# 检查环境变量
cat ~/.openwork/.env | grep CUSTOM

# 检查应用日志
# 在开发者工具 Console 中查看
```

## 获取帮助

如果以上方法都无法解决问题：

1. **收集信息**
   - 错误消息的完整文本
   - 控制台日志（Console 标签页）
   - 网络请求详情（Network 标签页）
   - 配置文件内容（隐藏敏感信息）

2. **提交 Issue**
   - 访问 [GitHub Issues](https://github.com/langchain-ai/openwork/issues)
   - 使用 "Custom API" 标签
   - 提供详细的复现步骤

3. **查看文档**
   - [CUSTOM_API.md](CUSTOM_API.md) - 详细使用指南
   - [QUICK_START_CUSTOM_API.md](QUICK_START_CUSTOM_API.md) - 快速开始
   - [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - 技术细节

## 常见配置示例

### OpenAI 官方 API
```bash
CUSTOM_BASE_URL=https://api.openai.com/v1
CUSTOM_API_KEY=sk-proj-xxx
CUSTOM_MODEL=gpt-4
```

### Azure OpenAI
```bash
CUSTOM_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
CUSTOM_API_KEY=your-azure-key
CUSTOM_MODEL=gpt-4
```

### 本地 vLLM
```bash
CUSTOM_BASE_URL=http://localhost:8000/v1
CUSTOM_API_KEY=token-abc123
CUSTOM_MODEL=meta-llama/Llama-2-7b-chat-hf
```

### Ollama (OpenAI 兼容模式)
```bash
CUSTOM_BASE_URL=http://localhost:11434/v1
CUSTOM_API_KEY=ollama
CUSTOM_MODEL=llama2
```

## 预防措施

1. **定期备份配置**
   ```bash
   cp ~/.openwork/.env ~/.openwork/.env.backup
   ```

2. **使用版本控制**（不要提交敏感信息）
   ```bash
   # .gitignore
   .env
   *.env
   ```

3. **定期更新 API Key**
   - 设置提醒定期更换
   - 使用有限权限的 API Key

4. **监控使用情况**
   - 检查 API 使用量
   - 设置使用限制和告警
