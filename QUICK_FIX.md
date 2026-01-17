# 快速修复 - Custom API 配置问题

## 🚨 问题：配置了 Custom API 但还是报错 "Anthropic API key not configured"

### ⚡ 快速解决（3 步）

#### 1️⃣ 确认配置已保存
```bash
cat ~/.openwork/.env | grep CUSTOM
```

应该看到：
```
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_API_KEY=your-key
CUSTOM_MODEL=your-model
```

如果没有，重新配置：
1. 点击 Custom API 的 🔑 图标
2. 填写 Base URL 和 API Key
3. 点击 Save

#### 2️⃣ 重新构建应用
```bash
# 停止当前应用（Ctrl+C）
npm run build
npm run dev
```

#### 3️⃣ 选择 Custom API 模型

**重要**: 不要选择 Claude、GPT 或 Gemini 模型！

1. 点击模型选择器（显示当前模型名称的按钮）
2. 左侧选择 **"Custom API"**
3. 右侧点击 **"custom"** 模型
4. 确认模型选择器显示 "custom"

### ✅ 验证

发送测试消息，检查控制台（Cmd/Ctrl + Shift + I）：

**正确** ✅:
```
[Runtime] Using model: custom
[Runtime] Custom API config present: true
```

**错误** ❌:
```
[Runtime] Using model: claude-sonnet-4-5-20250929
[Runtime] Anthropic API key present: false
```

---

## 🔍 其他常见问题

### 找不到 Custom API 选项？
```bash
npm run build
npm run dev
```

### Custom API 显示为灰色/不可用？
1. 点击 🔑 图标
2. 确认 Base URL 和 API Key 都已填写
3. 点击 Save

### 配置保存但不生效？
```bash
# 1. 检查配置
cat ~/.openwork/.env

# 2. 重启应用
# 完全关闭，然后重新启动

# 3. 清除缓存（如果需要）
rm -rf ~/.openwork/cache
```

### 请求发送到错误的端点？
1. 打开开发者工具（Cmd/Ctrl + Shift + I）
2. 切换到 Network 标签页
3. 发送消息
4. 查看 POST 请求的 URL
5. 确认是你配置的 Base URL

---

## 📋 完整检查清单

- [ ] 配置文件存在且正确
- [ ] 应用已重新构建
- [ ] 在 UI 中选择了 "Custom API" provider
- [ ] 在 UI 中选择了 "custom" 模型
- [ ] 模型选择器显示 "custom"
- [ ] 控制台日志显示 "Using model: custom"
- [ ] 请求发送到正确的端点

---

## 🆘 还是不行？

查看详细的故障排除指南：
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 完整的故障排除指南
- [CUSTOM_API.md](CUSTOM_API.md) - 详细使用说明
- [QUICK_START_CUSTOM_API.md](QUICK_START_CUSTOM_API.md) - 快速开始指南

或提交 Issue：
- [GitHub Issues](https://github.com/langchain-ai/openwork/issues)
