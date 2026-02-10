import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CreateMCPServerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

interface FormData {
  id: string
  name: string
  type: "stdio" | "sse"
  command: string
  args: string
  url: string
  description: string
  category: string
  enabled: boolean
  env: Record<string, string>
}

const TRANSPORT_TYPES = [
  { value: "stdio", label: "STDIO", description: "标准输入/输出 (本地进程)" },
  { value: "sse", label: "SSE", description: "服务器发送事件 (HTTP端点)" }
]

const CATEGORIES = [
  { value: "filesystem", label: "文件系统", description: "文件操作工具" },
  { value: "database", label: "数据库", description: "数据库访问工具" },
  { value: "api", label: "API", description: "外部API集成" },
  { value: "development", label: "开发", description: "开发工具" },
  { value: "productivity", label: "生产力", description: "生产力工具" },
  { value: "custom", label: "自定义", description: "其他工具" }
]

interface EnvVar {
  key: string
  value: string
}

export function CreateMCPServerDialog({ open, onClose, onCreated }: CreateMCPServerDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    type: "stdio",
    command: "",
    args: "",
    url: "",
    description: "",
    category: "custom",
    enabled: true,
    env: {}
  })
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "", value: "" }])

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tools?: number } | null>(null)

  // Handle env vars change
  const handleEnvVarChange = (index: number, field: "key" | "value", value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index][field] = value
    setEnvVars(newEnvVars)

    // Update formData.env
    const env: Record<string, string> = {}
    newEnvVars.forEach((envVar) => {
      if (envVar.key.trim()) {
        env[envVar.key.trim()] = envVar.value
      }
    })
    setFormData({ ...formData, env })
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }])
  }

  const removeEnvVar = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index)
    setEnvVars(newEnvVars)

    // Update formData.env
    const env: Record<string, string> = {}
    newEnvVars.forEach((envVar) => {
      if (envVar.key.trim()) {
        env[envVar.key.trim()] = envVar.value
      }
    })
    setFormData({ ...formData, env })
  }

  if (!open) return null

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.id.trim()) {
      newErrors.id = "ID不能为空"
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = "ID只能包含小写字母、数字和连字符"
    }

    if (!formData.name.trim()) {
      newErrors.name = "名称不能为空"
    }

    if (formData.type === "stdio" && !formData.command.trim()) {
      newErrors.command = "STDIO类型需要命令"
    }

    if (formData.type === "sse") {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = "请输入有效的URL"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Parse args
      const argsArray = formData.args
        .split(" ")
        .map((arg) => arg.trim())
        .filter(Boolean)

      const result = await window.api.mcp.create({
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type,
        command: formData.type === "stdio" ? formData.command.trim() : undefined,
        args: formData.type === "stdio" && argsArray.length > 0 ? argsArray : undefined,
        url: formData.type === "sse" ? formData.url.trim() : undefined,
        description: formData.description.trim() || undefined,
        category: formData.category,
        enabled: formData.enabled,
        env: Object.keys(formData.env).length > 0 ? formData.env : undefined
      })

      if (result.success) {
        onCreated()
        onClose()
      } else {
        setErrors({ id: result.error || "创建失败" })
      }
    } catch (error) {
      console.error("[CreateMCPServerDialog] Create error:", error)
      setErrors({ id: "创建失败，请重试" })
    }
  }

  const handleTest = async () => {
    if (formData.type === "stdio" && !formData.command.trim()) {
      setErrors({ command: "请先输入命令" })
      return
    }

    if (formData.type === "sse" && !formData.url.trim()) {
      setErrors({ url: "请先输入URL" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const argsArray = formData.args
        .split(" ")
        .map((arg) => arg.trim())
        .filter(Boolean)

      const result = await window.api.mcp.test({
        type: formData.type,
        command: formData.type === "stdio" ? formData.command.trim() : undefined,
        args: formData.type === "stdio" && argsArray.length > 0 ? argsArray : undefined,
        url: formData.type === "sse" ? formData.url.trim() : undefined,
        env: Object.keys(formData.env).length > 0 ? formData.env : undefined
      })

      setTestResult({
        success: result.success,
        message: result.success
          ? `连接成功！发现 ${result.tools || 0} 个工具`
          : result.error || "连接失败",
        tools: result.tools
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "测试失败"
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-[#1A1A1D] rounded-lg shadow-xl border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">添加MCP服务器</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Transport Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              传输类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    formData.type === type.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-75">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              服务器ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="例如: filesystem-server"
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
            {errors.id && <p className="text-xs text-status-critical mt-1">{errors.id}</p>}
            <p className="text-xs text-gray-500 mt-1">唯一标识符，只能包含小写字母、数字和连字符</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              显示名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 文件系统服务器"
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
            {errors.name && <p className="text-xs text-status-critical mt-1">{errors.name}</p>}
          </div>

          {/* STDIO: Command */}
          {formData.type === "stdio" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                命令 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.command}
                onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                placeholder="例如: npx"
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                required={formData.type === "stdio"}
              />
              {errors.command && <p className="text-xs text-status-critical mt-1">{errors.command}</p>}
            </div>
          )}

          {/* STDIO: Args */}
          {formData.type === "stdio" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">命令参数</label>
              <input
                type="text"
                value={formData.args}
                onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                placeholder="例如: @modelcontextprotocol/server-filesystem /path/to/dir"
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">多个参数用空格分隔</p>
            </div>
          )}

          {/* Environment Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">环境变量</label>
            <div className="space-y-2">
              {envVars.map((envVar, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={envVar.key}
                    onChange={(e) => handleEnvVarChange(index, "key", e.target.value)}
                    placeholder="变量名 (如: YAPI_BASE_URL)"
                    className="flex-1 px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={envVar.value}
                    onChange={(e) => handleEnvVarChange(index, "value", e.target.value)}
                    placeholder="值 (不要包含引号)"
                    className="flex-1 px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                  />
                  {envVars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="px-2 py-1 text-status-critical hover:bg-status-critical/20 rounded-md transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEnvVar}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + 添加环境变量
            </button>
            <p className="text-xs text-gray-500 mt-1">可选，用于传递敏感信息或配置参数。直接输入值即可，不要包含引号或JSON格式</p>
          </div>

          {/* SSE: URL */}
          {formData.type === "sse" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                服务器URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="例如: http://localhost:3000/sse"
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                required={formData.type === "sse"}
              />
              {errors.url && <p className="text-xs text-status-critical mt-1">{errors.url}</p>}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">描述</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="可选的服务器描述"
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">分类</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    formData.category === cat.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs opacity-75">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                testResult.success
                  ? "bg-status-nominal/20 text-status-nominal border border-status-nominal/50"
                  : "bg-status-critical/20 text-status-critical border border-status-critical/50"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleTest}
            disabled={testing}
            className="text-xs"
          >
            {testing ? "测试中..." : "测试连接"}
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit}>
            创建服务器
          </Button>
        </div>
      </div>
    </div>
  )
}
