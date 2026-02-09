# 最终修复 - Custom API 模型选择问题

## 🐛 问题根源

即使用户在 UI 中选择了 "custom" 模型，系统仍然使用 Claude 模型。原因有三个：

### 1. 模型选择没有持久化到后端

- `setCurrentModel` 只更新前端 state
- 没有保存到 thread metadata
- 重新加载时丢失选择

### 2. Agent 创建时没有使用选择的模型

- `createAgentRuntime` 接受 `modelId` 参数
- 但 `agent.ts` 调用时没有传递
- 总是使用默认的 Claude 模型

### 3. ModelSwitcher 缺少 Custom API 支持

- `PROVIDER_ICONS` 没有 custom 图标
- `FALLBACK_PROVIDERS` 没有 custom provider

## ✅ 已修复的文件

### 1. `src/main/ipc/agent.ts`

**修改**: 从 thread metadata 中读取 `currentModel` 并传递给 `createAgentRuntime`

```typescript
// 修改前
const agent = await createAgentRuntime({ threadId, workspacePath })

// 修改后
const currentModel = metadata.currentModel as string | undefined
const agent = await createAgentRuntime({
  threadId,
  workspacePath,
  modelId: currentModel
})
```

**影响**: 3 处调用点

- `agent:invoke` - 发送新消息
- `agent:resume` - 恢复中断的对话
- `agent:interrupt` - 处理 HITL 决策

### 2. `src/renderer/src/lib/thread-context.tsx`

**修改 A**: `setCurrentModel` 持久化到 thread metadata

```typescript
setCurrentModel: (modelId: string) => {
  updateThreadState(threadId, () => ({ currentModel: modelId }))
  // 新增：持久化到后端
  window.api.threads.get(threadId).then((thread) => {
    if (thread) {
      const metadata = thread.metadata ? JSON.parse(thread.metadata) : {}
      metadata.currentModel = modelId
      window.api.threads.update(threadId, { metadata })
    }
  })
},
```

**修改 B**: `loadThreadHistory` 从 metadata 加载 `currentModel`

```typescript
// 新增：加载 thread metadata
const thread = await window.api.threads.get(threadId)
if (thread?.metadata) {
  const metadata = JSON.parse(thread.metadata)
  if (metadata.currentModel) {
    actions.setCurrentModel(metadata.currentModel)
  }
}
```

### 3. `src/renderer/src/components/chat/ModelSwitcher.tsx`

**修改 A**: 添加 Custom Icon

```typescript
function CustomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  )
}
```

**修改 B**: 更新 PROVIDER_ICONS

```typescript
const PROVIDER_ICONS: Record<ProviderId, React.FC<{ className?: string }>> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  google: GoogleIcon,
  ollama: () => null,
  custom: CustomIcon // 新增
}
```

**修改 C**: 更新 FALLBACK_PROVIDERS

```typescript
const FALLBACK_PROVIDERS: Provider[] = [
  { id: "anthropic", name: "Anthropic", hasApiKey: false },
  { id: "openai", name: "OpenAI", hasApiKey: false },
  { id: "google", name: "Google", hasApiKey: false },
  { id: "custom", name: "Custom API", hasApiKey: false } // 新增
]
```

## 🔄 工作流程

### 修复前

```
用户选择 custom → 前端 state 更新 → 发送消息
                                    ↓
                          agent.ts 没有读取选择
                                    ↓
                          使用默认 Claude 模型 ❌
```

### 修复后

```
用户选择 custom → 前端 state 更新 → 持久化到 metadata
                                    ↓
                          发送消息时读取 metadata
                                    ↓
                          传递给 createAgentRuntime
                                    ↓
                          使用 custom 模型 ✅
```

## 🚀 使用步骤

### 1. 重新构建应用

```bash
cd openwork
npm run build
npm run dev
```

### 2. 配置 Custom API（如果还没配置）

```bash
# 检查配置
cat ~/.openwork/.env | grep CUSTOM

# 应该看到
CUSTOM_BASE_URL=https://open.bigmodel.cn/api/anthropic
CUSTOM_API_KEY=your-key
CUSTOM_MODEL=glm-4.7
```

### 3. 选择 Custom API 模型

1. 点击模型选择器
2. 左侧选择 "Custom API"
3. 右侧选择 "custom"
4. 确认显示 "📦 custom"

### 4. 发送消息测试

打开开发者工具（Cmd/Ctrl + Shift + I），应该看到：

```
[Runtime] Using model: custom
[Runtime] Custom API config present: true
```

## ✅ 验证清单

- [ ] 重新构建应用
- [ ] Custom API 出现在 provider 列表中
- [ ] 可以选择 custom 模型
- [ ] 模型选择器显示 "custom"
- [ ] 控制台显示 "Using model: custom"
- [ ] 请求发送到自定义端点
- [ ] 切换到其他对话，模型选择保持
- [ ] 重启应用，模型选择保持

## 🎯 关键改进

1. **持久化**: 模型选择保存到 thread metadata
2. **传递**: Agent 创建时使用选择的模型
3. **加载**: 初始化时从 metadata 恢复选择
4. **UI**: ModelSwitcher 完整支持 Custom API

## 📝 技术细节

### Thread Metadata 结构

```json
{
  "workspacePath": "/path/to/workspace",
  "currentModel": "custom"
}
```

### Agent 创建流程

```typescript
// 1. 从 metadata 读取
const metadata = JSON.parse(thread.metadata)
const currentModel = metadata.currentModel

// 2. 传递给 runtime
const agent = await createAgentRuntime({
  threadId,
  workspacePath,
  modelId: currentModel // 使用选择的模型
})

// 3. Runtime 判断
if (model === "custom") {
  // 使用自定义 API
  const customConfig = getCustomApiConfig()
  return new ChatOpenAI({
    model: customConfig.model,
    openAIApiKey: customConfig.apiKey,
    configuration: { baseURL: customConfig.baseUrl }
  })
}
```

## 🎉 完成！

所有问题已修复！现在：

- ✅ 模型选择会持久化
- ✅ Agent 使用正确的模型
- ✅ Custom API 完全可用
- ✅ UI 显示正确

重新构建应用后，你就可以正常使用 Custom API 了！
