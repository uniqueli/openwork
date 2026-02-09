# 自定义 API 功能测试清单

## 功能已实现

✅ **存储层** - 支持保存和读取 baseUrl, apiKey, model
✅ **类型定义** - 所有类型都包含 baseUrl 字段
✅ **IPC 通信** - 完整的 IPC 方法支持
✅ **Agent Runtime** - 使用 customConfig.baseUrl 创建客户端
✅ **UI 界面** - 完整的表单包含 Base URL 输入框

## 测试步骤

### 1. 通过 UI 配置自定义 API

1. 启动应用：`npm run dev`
2. 打开设置对话框（点击设置按钮）
3. 滚动到 "Custom API" 部分
4. 填写以下信息：
   - **Base URL**: `https://api.openai.com/v1` (或你的自定义端点)
   - **API Key**: 你的 API 密钥
   - **Model Name**: `gpt-4` (可选)
5. 点击 "Save Custom API"
6. 确认显示 "Configured" 状态

### 2. 验证配置已保存

打开终端，检查配置文件：

```bash
cat ~/.openwork/.env
```

应该看到：

```
CUSTOM_BASE_URL=https://api.openai.com/v1
CUSTOM_API_KEY=your-api-key
CUSTOM_MODEL=gpt-4
```

### 3. 使用自定义 API

1. 在模型选择器中选择 "Custom API"
2. 创建新对话或在现有对话中发送消息
3. 检查控制台日志，应该看到：
   ```
   [Runtime] Using model: custom
   [Runtime] Custom API config present: true
   ```

### 4. 测试删除配置

1. 打开设置对话框
2. 点击 "Delete" 按钮
3. 确认配置被清除
4. 验证 `~/.openwork/.env` 文件中相关配置已删除

### 5. 通过环境变量配置

1. 手动编辑 `~/.openwork/.env`：
   ```bash
   echo "CUSTOM_BASE_URL=https://api.example.com/v1" >> ~/.openwork/.env
   echo "CUSTOM_API_KEY=test-key" >> ~/.openwork/.env
   echo "CUSTOM_MODEL=test-model" >> ~/.openwork/.env
   ```
2. 重启应用
3. 打开设置对话框
4. 确认 Custom API 显示为 "Configured"
5. Base URL 和 Model 字段应该显示配置的值
6. API Key 应该显示为 `••••••••••••••••`

## 预期行为

### UI 状态指示器

- **Not set**: 未配置任何内容
- **Unsaved**: 有修改但未保存
- **Configured**: 已保存配置

### 字段验证

- Base URL 和 API Key 是必填项
- Model Name 是可选的
- 保存按钮在必填项为空时禁用

### 安全性

- API Key 默认隐藏显示为 `••••••••••••••••`
- 点击眼睛图标可以切换显示/隐藏
- 配置存储在本地 `~/.openwork/.env` 文件

## 常见问题排查

### 问题 1: 保存后配置没有生效

**检查**:

- 查看浏览器控制台是否有错误
- 检查 `~/.openwork/.env` 文件是否正确写入
- 重启应用

### 问题 2: 自定义 API 不可用

**检查**:

- 确认 Base URL 和 API Key 都已配置
- 在模型列表中查看 "Custom API" 的 available 状态
- 检查控制台日志

### 问题 3: 请求失败

**检查**:

- Base URL 格式是否正确（应该包含 `/v1` 后缀）
- API Key 是否有效
- 自定义端点是否兼容 OpenAI API 格式
- 查看网络请求和错误信息

## 代码验证点

### 1. storage.ts

```typescript
export interface CustomApiConfig {
  baseUrl: string // ✅ 包含 baseUrl
  apiKey: string
  model?: string
}
```

### 2. runtime.ts

```typescript
return new ChatOpenAI({
  model: customConfig.model || model,
  openAIApiKey: customConfig.apiKey,
  configuration: {
    baseURL: customConfig.baseUrl // ✅ 使用 baseUrl
  }
})
```

### 3. SettingsDialog.tsx

```tsx
<Input
  type="text"
  value={customConfig.baseUrl} // ✅ 绑定 baseUrl
  onChange={(e) => handleCustomConfigChange("baseUrl", e.target.value)}
  placeholder="https://api.example.com/v1"
/>
```

## 总结

所有代码都已正确实现 baseUrl 支持：

- ✅ 类型定义包含 baseUrl
- ✅ 存储函数读写 CUSTOM_BASE_URL
- ✅ Runtime 使用 customConfig.baseUrl
- ✅ UI 提供 Base URL 输入框
- ✅ IPC 方法传递完整配置对象

如果你看到的界面中没有 Base URL 输入框，可能需要：

1. 重新构建应用：`npm run build`
2. 清除缓存并重启
3. 检查是否使用了最新的代码
