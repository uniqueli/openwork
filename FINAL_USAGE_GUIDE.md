# 多自定义Provider功能 - 使用指南

## ✅ 功能完成

现在你可以通过模型选择器直接添加多个自定义Provider了！

## 使用方法

### 添加新的Provider

1. **点击模型选择器**（左上角显示当前模型的地方）

2. **在Provider列表底部**，找到 **+ 添加Provider** 按钮

3. **点击按钮**，会弹出"添加自定义Provider"对话框

4. **填写表单**：
   - **ID** *（必填）: 唯一标识符
     - 例如：`moonshot`、`zhipu`、`deepseek`
     - 只能使用小写字母、数字和连字符
   
   - **显示名称** *（必填）: 在Provider列表中显示的名字
     - 例如：`Moonshot AI`、`Zhipu AI`、`DeepSeek`
   
   - **Base URL** *（必填）: API端点地址
     - 例如：`https://api.moonshot.cn/v1`
   
   - **API Key** *（必填）: 你的API密钥
     - 例如：`sk-xxx...`
     - 点击眼睛图标可以显示/隐藏
   
   - **模型名称**（可选）: 模型的名字
     - 例如：`kimi-k2-turbo-preview`、`glm-4-plus`
     - 这个名字会直接显示在Model列表中

5. **点击"保存"**

6. **自动刷新**，新的Provider立即出现在列表中

7. **选择新的Provider**，然后选择模型，开始使用！

## 配置示例

### Moonshot AI (Kimi)

```
ID: moonshot
显示名称: Moonshot AI
Base URL: https://api.moonshot.cn/v1
API Key: sk-fY2r3dwk2wl3Gm1CVvLxkqGpnN5kytWsEFk9a06C9eNdZyqq
模型名称: kimi-k2-turbo-preview
```

**效果：**
- Provider列表显示：**Moonshot AI**
- Model列表显示：**kimi-k2-turbo-preview**

### Zhipu AI (GLM)

```
ID: zhipu
显示名称: Zhipu AI
Base URL: https://open.bigmodel.cn/api/paas/v4
API Key: your-zhipu-api-key
模型名称: glm-4-plus
```

**效果：**
- Provider列表显示：**Zhipu AI**
- Model列表显示：**glm-4-plus**

### DeepSeek

```
ID: deepseek
显示名称: DeepSeek
Base URL: https://api.deepseek.com/v1
API Key: your-deepseek-api-key
模型名称: deepseek-chat
```

**效果：**
- Provider列表显示：**DeepSeek**
- Model列表显示：**deepseek-chat**

## 界面说明

### 模型选择器布局

```
┌─────────────────┬─────────────────────────┐
│ PROVIDER        │ MODEL                   │
├─────────────────┼─────────────────────────┤
│ Anthropic    ⚠  │ kimi-k2-turbo-preview ✓ │
│ OpenAI          │                         │
│ Google       ⚠  │                         │
│ Moonshot AI     │                         │
│ Zhipu AI        │                         │
│                 │                         │
│ ─────────────── │                         │
│ + 添加Provider  │                         │
└─────────────────┴─────────────────────────┘
```

### 添加Provider对话框

```
┌─────────────────────────────────────┐
│ 添加自定义Provider                   │
├─────────────────────────────────────┤
│ 配置一个OpenAI兼容的API端点          │
│                                     │
│ ID *                                │
│ [moonshot                         ] │
│ 唯一标识符，只能使用小写字母...      │
│                                     │
│ 显示名称 *                          │
│ [Moonshot AI                      ] │
│ 这个名字会显示在Provider列表中       │
│                                     │
│ Base URL *                          │
│ [https://api.moonshot.cn/v1       ] │
│                                     │
│ API Key *                           │
│ [sk-xxx...                    ] 👁  │
│                                     │
│ 模型名称                            │
│ [kimi-k2-turbo-preview            ] │
│ 这个名字会直接显示在Model列表中      │
│                                     │
│              [取消]  [保存]         │
└─────────────────────────────────────┘
```

## 特点

- ✅ **快速添加** - 直接在模型选择器中添加，无需打开Settings
- ✅ **即时生效** - 添加后立即可用，无需重启应用
- ✅ **简洁界面** - 清晰的对话框，易于使用
- ✅ **表单验证** - 自动验证输入，确保配置正确
- ✅ **安全保护** - API Key可以显示/隐藏
- ✅ **无限添加** - 支持添加任意多个Provider

## 配置存储

所有配置保存在：`~/.openwork/.env`

格式：
```bash
CUSTOM_API_MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
CUSTOM_API_MOONSHOT_API_KEY=sk-xxx...
CUSTOM_API_MOONSHOT_NAME=Moonshot AI
CUSTOM_API_MOONSHOT_MODEL=kimi-k2-turbo-preview
```

## 支持的API提供商

任何OpenAI兼容的API都可以使用，包括：

- ✅ Moonshot AI (Kimi)
- ✅ Zhipu AI (GLM)
- ✅ DeepSeek
- ✅ 阿里云 (Qwen)
- ✅ 百川智能
- ✅ MiniMax
- ✅ Ollama (本地)
- ✅ LM Studio (本地)
- ✅ vLLM (本地)
- ✅ 任何OpenAI兼容的API

## 常见问题

### Q: 添加后看不到新的Provider？

**A:** 
1. 确认所有必填字段都已填写
2. 点击"保存"按钮
3. 关闭并重新打开模型选择器
4. 新的Provider应该出现在列表中

### Q: 如何删除Provider？

**A:** 
目前可以通过以下方式删除：
1. 打开Settings（右上角齿轮图标）
2. 找到Custom API部分
3. 或者直接编辑`~/.openwork/.env`文件删除对应配置

### Q: 可以添加多少个Provider？

**A:** 没有限制，可以添加任意多个。

### Q: ID可以包含中文吗？

**A:** 不可以。ID只能包含小写字母、数字和连字符。但是"显示名称"可以使用中文。

### Q: 如果API Key错误会怎样？

**A:** 在发送消息时会收到认证错误。请检查API Key是否正确。

## 故障排除

### 问题：401 认证错误

**解决方法：**
1. 检查API Key是否正确
2. 确认Base URL是否正确（大多数应该以`/v1`结尾）
3. 检查API Key是否有效且未过期

### 问题：模型未找到

**解决方法：**
1. 检查模型名称是否与API提供商匹配
2. 查看API提供商的文档确认可用的模型名称
3. 尝试留空模型名称字段

### 问题：请求超时

**解决方法：**
1. 检查网络连接
2. 确认Base URL是否可访问
3. 检查API服务是否正常

## 总结

现在你可以：
1. ✅ 通过模型选择器快速添加自定义Provider
2. ✅ 每个Provider显示你配置的名字
3. ✅ 每个Model显示你配置的模型名
4. ✅ 添加无限个Provider
5. ✅ 立即使用，无需重启

享受使用多个AI Provider的便利吧！🎉
