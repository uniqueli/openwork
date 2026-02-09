# 视觉变化说明

## ApiKeyDialog 对话框变化

### 之前（只有 API Key）

```
┌─────────────────────────────────────┐
│ Add Custom API API Key         [X] │
├─────────────────────────────────────┤
│ Enter your Custom API API key to   │
│ use their models.                   │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ [password input]         👁 │    │
│ └─────────────────────────────┘    │
│ Environment variable:               │
│ CUSTOM_API_KEY                      │
│                                     │
│              [Cancel]  [Save]       │
└─────────────────────────────────────┘
```

### 现在（包含 Base URL 和 Model Name）

```
┌─────────────────────────────────────┐
│ Add Custom API API Key         [X] │
├─────────────────────────────────────┤
│ Enter your Custom API API key to   │
│ use their models.                   │
│                                     │
│ Base URL                            │
│ ┌─────────────────────────────────┐ │
│ │ https://api.example.com/v1    │ │
│ └─────────────────────────────────┘ │
│ Environment variable:               │
│ CUSTOM_BASE_URL                     │
│                                     │
│ API Key                             │
│ ┌─────────────────────────────┐    │
│ │ [password input]         👁 │    │
│ └─────────────────────────────┘    │
│ Environment variable:               │
│ CUSTOM_API_KEY                      │
│                                     │
│ Model Name (Optional)               │
│ ┌─────────────────────────────────┐ │
│ │ gpt-4, claude-3-opus, etc.    │ │
│ └─────────────────────────────────┘ │
│ Environment variable:               │
│ CUSTOM_MODEL                        │
│                                     │
│              [Cancel]  [Save]       │
└─────────────────────────────────────┘
```

## 关键变化

### 1. 新增 Base URL 字段

- **位置**: 对话框顶部，第一个输入框
- **标签**: "Base URL"
- **占位符**: "https://api.example.com/v1"
- **必填**: 是
- **自动焦点**: 是（仅 Custom API）

### 2. API Key 字段保持不变

- **位置**: 中间
- **标签**: "API Key"
- **功能**: 显示/隐藏切换
- **必填**: 是

### 3. 新增 Model Name 字段

- **位置**: 对话框底部
- **标签**: "Model Name (Optional)"
- **占位符**: "gpt-4, claude-3-opus, etc."
- **必填**: 否

### 4. 环境变量提示

每个字段下方都显示对应的环境变量名称：

- `CUSTOM_BASE_URL`
- `CUSTOM_API_KEY`
- `CUSTOM_MODEL`

## 其他 Providers 保持不变

对于 Anthropic、OpenAI、Google 等官方 providers，对话框仍然只显示 API Key 输入框，没有任何变化。

## 交互流程

### 新建配置

1. 用户点击 Custom API 的配置图标
2. 对话框打开，Base URL 字段获得焦点
3. 用户输入 Base URL
4. 用户按 Tab 键移动到 API Key 字段
5. 用户输入 API Key
6. （可选）用户输入 Model Name
7. 用户点击 Save
8. 配置保存，对话框关闭

### 更新配置

1. 用户点击 Custom API 的配置图标
2. 对话框打开，自动加载现有的 Base URL 和 Model Name
3. API Key 显示为掩码 `••••••••••••••••`
4. 用户可以修改任何字段
5. 用户点击 Save
6. 配置更新，对话框关闭

### 删除配置

1. 用户点击 Custom API 的配置图标
2. 对话框打开，显示 "Remove Key" 按钮
3. 用户点击 "Remove Key"
4. 配置删除，对话框关闭

## 响应式设计

对话框宽度保持 `sm:max-w-[400px]`，所有字段垂直堆叠，适配不同屏幕尺寸。
