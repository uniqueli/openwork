import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddProviderDialog({ open, onOpenChange, onSuccess }: AddProviderDialogProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    // Validation
    if (!id || !name || !baseUrl || !apiKey) {
      setError("请填写所有必填字段")
      return
    }

    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(id)) {
      setError("ID只能包含小写字母、数字和连字符")
      return
    }

    setSaving(true)
    setError("")

    try {
      await window.api.models.setCustomApiConfig({
        id: id.toLowerCase(),
        name,
        baseUrl,
        apiKey,
        model: model || undefined
      })

      // Reset form
      setId("")
      setName("")
      setBaseUrl("")
      setApiKey("")
      setModel("")

      // Close dialog
      onOpenChange(false)

      // Notify parent
      onSuccess?.()
    } catch (e) {
      console.error("Failed to save custom API config:", e)
      setError("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setId("")
    setName("")
    setBaseUrl("")
    setApiKey("")
    setModel("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加自定义Provider</DialogTitle>
          <DialogDescription>配置一个OpenAI兼容的API端点</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              ID <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase())}
              placeholder="moonshot, zhipu, deepseek"
            />
            <p className="text-xs text-muted-foreground">
              唯一标识符，只能使用小写字母、数字和连字符
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              显示名称 <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Moonshot AI, Zhipu AI"
            />
            <p className="text-xs text-muted-foreground">这个名字会显示在Provider列表中</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Base URL <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.moonshot.cn/v1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              API Key <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">模型名称</label>
            <Input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="kimi-k2-turbo-preview, glm-4-plus"
            />
            <p className="text-xs text-muted-foreground">这个名字会直接显示在Model列表中（可选）</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !id || !name || !baseUrl || !apiKey}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
