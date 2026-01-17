# 更新说明 - 自定义 API 配置

## 问题

之前的实现中，`ApiKeyDialog` 组件（快速配置对话框）只支持配置 API Key，没有 Base URL 输入框。这导致用户无法通过快速对话框配置自定义 API。

## 解决方案

已更新 `ApiKeyDialog` 组件，为 Custom API provider 添加了特殊处理：

### 修改的文件

1. **src/renderer/src/components/chat/ApiKeyDialog.tsx**
   - 添加 `baseUrl` 和 `modelName` 状态
   - 为 Custom API 添加 Base URL 输入框
   - 为 Custom API 添加 Model Name 输入框（可选）
   - 更新保存逻辑，区分普通 API Key 和自定义 API 配置
   - 更新删除逻辑，支持删除自定义 API 配置
   - 添加加载现有配置的功能

2. **src/preload/index.d.ts**
   - 添加 `getCustomApiConfig` 方法类型定义
   - 添加 `setCustomApiConfig` 方法类型定义
   - 添加 `deleteCustomApiConfig` 方法类型定义

## 新功能

### 对于 Custom API Provider

当用户点击 Custom API 的配置按钮时，对话框会显示：

1. **Base URL** 输入框（必填）
   - 占位符：`https://api.example.com/v1`
   - 环境变量：`CUSTOM_BASE_URL`
   - 自动获得焦点

2. **API Key** 输入框（必填）
   - 占位符：`your-api-key`
   - 环境变量：`CUSTOM_API_KEY`
   - 支持显示/隐藏切换

3. **Model Name** 输入框（可选）
   - 占位符：`gpt-4, claude-3-opus, etc.`
   - 环境变量：`CUSTOM_MODEL`

### 对于其他 Providers

保持原有行为，只显示 API Key 输入框。

## 用户体验改进

1. **智能焦点管理**
   - Custom API: Base URL 字段自动获得焦点
   - 其他 Providers: API Key 字段自动获得焦点

2. **配置加载**
   - 如果已有配置，打开对话框时自动加载 Base URL 和 Model Name
   - API Key 仍然显示为掩码 `••••••••••••••••`

3. **验证**
   - Custom API: 要求 Base URL 和 API Key 都不为空
   - 其他 Providers: 只要求 API Key 不为空

4. **保存和删除**
   - Custom API: 使用 `setCustomApiConfig` 和 `deleteCustomApiConfig`
   - 其他 Providers: 使用 `setApiKey` 和 `deleteApiKey`

## 配置方式对比

现在用户有三种方式配置自定义 API：

| 方式 | 位置 | 特点 |
|------|------|------|
| 快速对话框 | 模型选择器旁的钥匙图标 | 快速、简洁，推荐使用 |
| 设置界面 | 设置 → Custom API | 完整、详细，可管理所有配置 |
| 环境变量 | ~/.openwork/.env | 手动编辑，适合高级用户 |

## 测试建议

1. 点击 Custom API 的配置图标
2. 验证显示三个输入框（Base URL, API Key, Model Name）
3. 填写 Base URL 和 API Key
4. 点击保存
5. 重新打开对话框，验证 Base URL 和 Model Name 已加载
6. 测试删除功能
7. 验证配置保存到 `~/.openwork/.env`

## 向后兼容性

- 完全向后兼容
- 不影响现有的 Anthropic、OpenAI、Google 配置
- 现有的自定义 API 配置会自动加载
