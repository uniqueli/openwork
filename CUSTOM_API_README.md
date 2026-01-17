# 自定义 API 功能 - 文档索引

## 🎯 快速导航

### 新用户
👉 **从这里开始**: [QUICK_START_CUSTOM_API.md](QUICK_START_CUSTOM_API.md)  
5 分钟快速配置指南，包含常见配置示例

### 详细使用
📖 **完整指南**: [CUSTOM_API.md](CUSTOM_API.md)  
详细的使用说明、配置方式、兼容性和故障排除

### 开发者
🔧 **实现细节**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)  
技术架构、修改文件清单、配置流程

🔄 **更新说明**: [UPDATE_NOTES.md](UPDATE_NOTES.md)  
解决的问题、修改的文件、新功能说明

📝 **修改总结**: [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)  
所有修改的详细列表和技术实现

### 测试
✅ **测试清单**: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)  
完整的测试步骤和验证方法

📋 **最终检查**: [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)  
所有功能的完成状态和交付清单

### 故障排除
🚨 **快速修复**: [QUICK_FIX.md](QUICK_FIX.md)  
常见问题的快速解决方案（3 步修复）

🔧 **详细排查**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)  
完整的故障排除指南和调试技巧

### UI 变化
🎨 **视觉变化**: [VISUAL_CHANGES.md](VISUAL_CHANGES.md)  
对话框的前后对比和交互流程

## 📚 文档结构

```
openwork/
├── CUSTOM_API_README.md          # 本文件 - 文档索引
├── QUICK_START_CUSTOM_API.md     # 快速开始指南 ⭐
├── QUICK_FIX.md                  # 快速修复指南 🚨
├── CUSTOM_API.md                 # 详细使用指南
├── TROUBLESHOOTING.md            # 故障排除指南 🔧
├── IMPLEMENTATION_SUMMARY.md     # 实现总结
├── UPDATE_NOTES.md               # 更新说明
├── CHANGES_SUMMARY.md            # 修改总结
├── TESTING_CHECKLIST.md          # 测试清单
├── VISUAL_CHANGES.md             # 视觉变化
└── FINAL_CHECKLIST.md            # 最终检查清单
```

## 🚀 快速开始

### 1. 配置自定义 API（3 步）

```bash
# 步骤 1: 启动应用
npm run dev

# 步骤 2: 点击 Custom API 的配置图标 🔑

# 步骤 3: 填写配置
Base URL: https://api.openai.com/v1
API Key: sk-your-key
Model Name: gpt-4 (可选)
```

### 2. 使用自定义 API

1. 选择 "Custom API" 模型
2. 开始对话！

## 💡 核心功能

- ✅ 支持自定义 Base URL
- ✅ 支持自定义 API Key
- ✅ 支持可选的 Model Name
- ✅ 两种配置方式（快速对话框 + 完整设置）
- ✅ 配置安全存储在本地
- ✅ 支持所有 OpenAI 兼容的 API

## 🔧 配置示例

### OpenAI
```
Base URL: https://api.openai.com/v1
API Key: sk-...
Model: gpt-4
```

### Azure OpenAI
```
Base URL: https://your-resource.openai.azure.com/openai/deployments/your-deployment
API Key: your-azure-key
Model: gpt-4
```

### 本地 vLLM
```
Base URL: http://localhost:8000/v1
API Key: any-string
Model: your-model
```

## 📖 按需阅读

### 我想...

- **快速配置** → [QUICK_START_CUSTOM_API.md](QUICK_START_CUSTOM_API.md)
- **了解详细功能** → [CUSTOM_API.md](CUSTOM_API.md)
- **查看实现细节** → [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **了解修改内容** → [UPDATE_NOTES.md](UPDATE_NOTES.md)
- **查看所有修改** → [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)
- **进行测试** → [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- **查看 UI 变化** → [VISUAL_CHANGES.md](VISUAL_CHANGES.md)
- **检查完成状态** → [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)
- **快速修复问题** → [QUICK_FIX.md](QUICK_FIX.md) 🚨
- **详细故障排除** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 🔧

## 🆘 需要帮助？

### 常见问题

**Q: 保存按钮是灰色的？**  
A: 确保 Base URL 和 API Key 都已填写

**Q: 配置保存后不生效？**  
A: 尝试重启应用

**Q: 找不到 Custom API 选项？**  
A: 运行 `npm run build` 重新构建

**Q: 请求失败？**  
A: 检查 Base URL 格式、API Key 有效性、端点可访问性

### 获取更多帮助

- 🚨 **快速修复**: [QUICK_FIX.md](QUICK_FIX.md) - 常见问题的快速解决方案
- 🔧 **故障排除**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 详细的故障排除指南
- 📖 查看 [CUSTOM_API.md](CUSTOM_API.md) 的故障排除部分
- 🐛 提交 [GitHub Issue](https://github.com/langchain-ai/openwork/issues)
- 💬 查看项目文档

## 🎉 开始使用

现在你已经了解了所有文档，可以：

1. 阅读 [QUICK_START_CUSTOM_API.md](QUICK_START_CUSTOM_API.md) 快速开始
2. 配置你的自定义 API
3. 享受 openwork 的强大功能！

---

**提示**: 所有配置都存储在本地 `~/.openwork/.env` 文件中，安全可靠。
