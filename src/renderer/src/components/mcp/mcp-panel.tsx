import { useState, useEffect } from "react"
import { Plus, Trash2, Power, Plug, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateMCPServerDialog } from "./create-mcp-server-dialog"

interface MCPServerConfigStorage {
  id: string
  name: string
  type: "stdio" | "sse"
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  enabled: boolean
  description?: string
  icon?: string
  category?: string
  createdAt: string
  updatedAt: string
}

interface MCPServerWithState extends MCPServerConfigStorage {
  connectionStatus?: "disconnected" | "connecting" | "connected" | "error"
  toolCount?: number
}

export function MCPPanel(): React.JSX.Element {
  const [servers, setServers] = useState<MCPServerWithState[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Load MCP servers
  useEffect(() => {
    loadServers()
  }, [])

  // Poll connection states
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await window.api.mcp.getAllStates()
      if (result.success && result.states) {
        const stateMap = new Map()
        result.states.forEach((state) => {
          stateMap.set(state.serverId, state)
        })

        // Update server connection status
        setServers((prev) =>
          prev.map((server) => {
            const state = stateMap.get(server.id)
            return {
              ...server,
              connectionStatus: state?.status,
              toolCount: state?.tools?.length || 0
            }
          })
        )
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  async function loadServers() {
    setLoading(true)
    try {
      const result = await window.api.mcp.list()
      if (result.success && result.servers) {
        // Load initial connection states
        const statesResult = await window.api.mcp.getAllStates()
        const stateMap = new Map<string, any>()
        if (statesResult.success && statesResult.states) {
          statesResult.states.forEach((state) => {
            stateMap.set(state.serverId, state)
          })
        }

        setServers(
          result.servers.map((server) => ({
            ...server,
            connectionStatus: stateMap.get(server.id)?.status,
            toolCount: stateMap.get(server.id)?.tools?.length || 0
          }))
        )
      }
    } catch (error) {
      console.error("[MCPPanel] Failed to load servers:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleServer(serverId: string, currentEnabled: boolean) {
    console.log("[MCPPanel] Toggling server:", serverId, "from", currentEnabled, "to", !currentEnabled)
    try {
      const result = await window.api.mcp.toggle(serverId, !currentEnabled)
      console.log("[MCPPanel] Toggle result:", result)
      if (result.success) {
        // Optimistically update UI
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId ? { ...s, enabled: !currentEnabled } : s
          )
        )
        // Then reload from server
        await loadServers()
      } else {
        alert(`切换失败: ${result.error}`)
      }
    } catch (error) {
      console.error("[MCPPanel] Failed to toggle server:", error)
      alert(`切换失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  async function handleDeleteServer(serverId: string) {
    if (!confirm("确定要删除这个MCP服务器吗?")) return

    console.log("[MCPPanel] Deleting server:", serverId)
    try {
      const result = await window.api.mcp.delete(serverId)
      console.log("[MCPPanel] Delete result:", result)
      if (result.success) {
        // Optimistically update UI
        setServers((prev) => prev.filter((s) => s.id !== serverId))
        // Then reload from server
        await loadServers()
      } else {
        alert(`删除失败: ${result.error}`)
      }
    } catch (error) {
      console.error("[MCPPanel] Failed to delete server:", error)
      alert(`删除失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  async function handleConnect(serverId: string) {
    console.log("[MCPPanel] Connecting to server:", serverId, "type:", typeof serverId)
    try {
      // Optimistically update UI to connecting state
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId ? { ...s, connectionStatus: "connecting" } : s
        )
      )

      console.log("[MCPPanel] Calling window.api.mcp.connect with:", serverId)
      const result = await window.api.mcp.connect(serverId)
      console.log("[MCPPanel] Connect result:", result)

      if (result.success) {
        // Reload to get actual state
        await loadServers()
      } else {
        alert(`连接失败: ${result.error}`)
        // Reload to reset state
        await loadServers()
      }
    } catch (error) {
      console.error("[MCPPanel] Failed to connect:", error)
      alert(`连接失败: ${error instanceof Error ? error.message : "未知错误"}`)
      // Reload to reset state
      await loadServers()
    }
  }

  async function handleDisconnect(serverId: string) {
    console.log("[MCPPanel] Disconnecting from server:", serverId)
    try {
      const result = await window.api.mcp.disconnect(serverId)
      console.log("[MCPPanel] Disconnect result:", result)

      if (result.success) {
        // Optimistically update UI
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId ? { ...s, connectionStatus: "disconnected", toolCount: 0 } : s
          )
        )
        // Then reload from server
        await loadServers()
      } else {
        alert(`断开连接失败: ${result.error}`)
      }
    } catch (error) {
      console.error("[MCPPanel] Failed to disconnect:", error)
      alert(`断开连接失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with add button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-background/30">
        <span className="text-[10px] text-muted-foreground">
          {servers.filter((s) => s.enabled).length} / {servers.length} 启用
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="h-5 px-1.5 text-[10px]"
        >
          <Plus className="size-3" />
          <span className="ml-1">添加</span>
        </Button>
      </div>

      {/* Server list or empty state */}
      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-8 px-4 flex-1">
          <Plug className="size-8 mb-2 opacity-50" />
          <span>没有MCP服务器</span>
          <span className="text-xs mt-1">点击"添加"配置服务器</span>
        </div>
      ) : (
        <div className="py-2 overflow-auto flex-1">
          <div className="px-3 space-y-2">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onToggle={handleToggleServer}
                onDelete={handleDeleteServer}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateMCPServerDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={loadServers}
        />
      )}
    </div>
  )
}

interface ServerCardProps {
  server: MCPServerWithState
  onToggle: (serverId: string, enabled: boolean) => void
  onDelete: (serverId: string) => void
  onConnect: (serverId: string) => void
  onDisconnect: (serverId: string) => void
}

function ServerCard({ server, onToggle, onDelete, onConnect, onDisconnect }: ServerCardProps) {
  const getStatusIcon = () => {
    if (!server.enabled) {
      return <Circle className="size-3 text-muted-foreground" />
    }

    switch (server.connectionStatus) {
      case "connected":
        return <CheckCircle2 className="size-3 text-status-nominal" />
      case "connecting":
        return <Loader2 className="size-3 animate-spin text-status-info" />
      case "error":
        return <XCircle className="size-3 text-status-critical" />
      default:
        return <Circle className="size-3 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    if (!server.enabled) return "已禁用"
    switch (server.connectionStatus) {
      case "connected":
        return "已连接"
      case "connecting":
        return "连接中"
      case "error":
        return "错误"
      default:
        return "未连接"
    }
  }

  const getTransportTypeLabel = () => {
    return server.type === "stdio" ? "STDIO" : "SSE"
  }

  return (
    <div className="p-3 rounded-sm border border-border bg-background/50 hover:bg-background transition-colors">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="flex-1 text-sm font-medium truncate">{server.name}</span>
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
          {getTransportTypeLabel()}
        </Badge>
      </div>

      {/* Details */}
      <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <span>状态:</span>
          <span className={server.connectionStatus === "connected" ? "text-status-nominal" : ""}>
            {getStatusText()}
          </span>
        </div>
        {server.connectionStatus === "connected" && server.toolCount !== undefined && (
          <div className="flex items-center justify-between">
            <span>工具:</span>
            <span>{server.toolCount}</span>
          </div>
        )}
        {server.description && (
          <div className="text-[10px] truncate" title={server.description}>
            {server.description}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2">
        {/* Toggle enable/disable */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(server.id, server.enabled)}
          className={`h-6 px-2 text-[10px] flex-1 ${
            server.enabled ? "text-status-nominal hover:text-status-nominal" : ""
          }`}
          title={server.enabled ? "禁用" : "启用"}
        >
          <Power className="size-3" />
        </Button>

        {/* Connect/Disconnect */}
        {server.enabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              server.connectionStatus === "connected"
                ? onDisconnect(server.id)
                : onConnect(server.id)
            }
            className="h-6 px-2 text-[10px] flex-1"
            disabled={server.connectionStatus === "connecting"}
            title={server.connectionStatus === "connected" ? "断开" : "连接"}
          >
            {server.connectionStatus === "connecting" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : server.connectionStatus === "connected" ? (
              <XCircle className="size-3" />
            ) : (
              <Plug className="size-3" />
            )}
          </Button>
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(server.id)}
          className="h-6 px-2 text-[10px] text-status-critical hover:text-status-critical"
          title="删除"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}
