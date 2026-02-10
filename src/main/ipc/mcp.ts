/**
 * MCP (Model Context Protocol) IPC Handlers
 *
 * Handles all MCP-related IPC communication between main and renderer processes.
 */

import { IpcMain } from "electron"
import {
  loadMCPConfig,
  getMCPServerConfig,
  saveMCPServerConfig,
  deleteMCPServerConfig,
  toggleMCPServerEnabled
} from "../storage"
import { getMCPManager } from "../agent/mcp/mcp-manager"
import type { MCPServerConfigStorage } from "../storage"

// =============================================================================
// MCP IPC Parameter Types
// =============================================================================

export interface MCPListParams {
  enabledOnly?: boolean
}

export interface MCPGetParams {
  serverId: string
}

export interface MCPCreateParams {
  id: string
  name: string
  type: "stdio" | "sse"
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  enabled?: boolean
  description?: string
  icon?: string
  category?: string
}

export interface MCPUpdateParams {
  serverId: string
  name?: string
  type?: "stdio" | "sse"
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  enabled?: boolean
  description?: string
  icon?: string
  category?: string
}

export interface MCPDeleteParams {
  serverId: string
}

export interface MCPToggleParams {
  serverId: string
  enabled: boolean
}

export interface MCPConnectParams {
  serverId: string
}

export interface MCPDisconnectParams {
  serverId: string
}

export interface MCPGetStateParams {
  serverId: string
}

export interface MCPTestParams {
  type: "stdio" | "sse"
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
}

// =============================================================================
// MCP IPC Handlers
// =============================================================================

export function registerMCPHandlers(ipcMain: IpcMain): void {
  console.log("[MCP] Registering MCP handlers...")

  // List all MCP servers
  ipcMain.on("mcp:list", (event, params?: MCPListParams) => {
    console.log("[MCP] List request:", params)

    try {
      const config = loadMCPConfig()
      let servers = config.servers

      if (params?.enabledOnly) {
        servers = servers.filter((s) => s.enabled)
      }

      event.reply("mcp:list:result", {
        success: true,
        servers
      })
    } catch (error) {
      console.error("[MCP] List error:", error)
      event.reply("mcp:list:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get a specific MCP server
  ipcMain.on("mcp:get", (event, params) => {
    console.log("[MCP] Get request received, params:", params)

    // Handle both formats
    let serverId: string
    if (typeof params === "string") {
      serverId = params
    } else if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:get:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Get request:", serverId)

    try {
      const server = getMCPServerConfig(serverId)

      if (!server) {
        event.reply("mcp:get:result", {
          success: false,
          error: `MCP server not found: ${serverId}`
        })
        return
      }

      event.reply("mcp:get:result", {
        success: true,
        server
      })
    } catch (error) {
      console.error("[MCP] Get error:", error)
      event.reply("mcp:get:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Create a new MCP server
  ipcMain.on("mcp:create", (event, params: MCPCreateParams) => {
    console.log("[MCP] Create request:", params.name)

    try {
      // Check if server ID already exists
      const existing = getMCPServerConfig(params.id)
      if (existing) {
        event.reply("mcp:create:result", {
          success: false,
          error: `MCP server with ID "${params.id}" already exists`
        })
        return
      }

      // Validate required fields based on type
      if (params.type === "stdio" && !params.command) {
        event.reply("mcp:create:result", {
          success: false,
          error: "Stdio servers require a 'command' field"
        })
        return
      }

      if (params.type === "sse" && !params.url) {
        event.reply("mcp:create:result", {
          success: false,
          error: "SSE servers require a 'url' field"
        })
        return
      }

      const server: MCPServerConfigStorage = {
        id: params.id,
        name: params.name,
        type: params.type,
        command: params.command,
        args: params.args,
        url: params.url,
        env: params.env,
        enabled: params.enabled !== undefined ? params.enabled : true,
        description: params.description,
        icon: params.icon,
        category: params.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      saveMCPServerConfig(server)

      event.reply("mcp:create:result", {
        success: true,
        server
      })
    } catch (error) {
      console.error("[MCP] Create error:", error)
      event.reply("mcp:create:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Update an existing MCP server
  ipcMain.on("mcp:update", (event, params) => {
    console.log("[MCP] Update request received, params:", params)

    // Handle both formats
    let serverId: string
    if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:update:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Update request:", serverId)

    try {
      const existing = getMCPServerConfig(params.serverId)

      if (!existing) {
        event.reply("mcp:update:result", {
          success: false,
          error: `MCP server not found: ${params.serverId}`
        })
        return
      }

      // Validate required fields if type is being changed
      if (params.type === "stdio" && params.type !== existing.type && !params.command) {
        event.reply("mcp:update:result", {
          success: false,
          error: "Stdio servers require a 'command' field"
        })
        return
      }

      if (params.type === "sse" && params.type !== existing.type && !params.url) {
        event.reply("mcp:update:result", {
          success: false,
          error: "SSE servers require a 'url' field"
        })
        return
      }

      const updated: MCPServerConfigStorage = {
        ...existing,
        ...(params.name && { name: params.name }),
        ...(params.type && { type: params.type }),
        ...(params.command !== undefined && { command: params.command }),
        ...(params.args !== undefined && { args: params.args }),
        ...(params.url !== undefined && { url: params.url }),
        ...(params.env !== undefined && { env: params.env }),
        ...(params.enabled !== undefined && { enabled: params.enabled }),
        ...(params.description !== undefined && { description: params.description }),
        ...(params.icon !== undefined && { icon: params.icon }),
        ...(params.category !== undefined && { category: params.category }),
        updatedAt: new Date().toISOString()
      }

      saveMCPServerConfig(updated)

      event.reply("mcp:update:result", {
        success: true,
        server: updated
      })
    } catch (error) {
      console.error("[MCP] Update error:", error)
      event.reply("mcp:update:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Delete an MCP server
  ipcMain.on("mcp:delete", (event, params) => {
    console.log("[MCP] Delete request received, params:", params)

    // Handle both formats
    let serverId: string
    if (typeof params === "string") {
      serverId = params
    } else if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:delete:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Delete request:", serverId)

    try {
      const existing = getMCPServerConfig(serverId)

      if (!existing) {
        event.reply("mcp:delete:result", {
          success: false,
          error: `MCP server not found: ${serverId}`
        })
        return
      }

      // Disconnect if connected
      const mcpManager = getMCPManager()
      mcpManager.disconnectServer(serverId).catch((err) => {
        console.error("[MCP] Error disconnecting server:", err)
      })

      deleteMCPServerConfig(serverId)

      event.reply("mcp:delete:result", {
        success: true
      })
    } catch (error) {
      console.error("[MCP] Delete error:", error)
      event.reply("mcp:delete:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Toggle MCP server enabled state
  ipcMain.on("mcp:toggle", (event, params) => {
    console.log("[MCP] Toggle request received, params:", params)

    // Handle both formats
    let serverId: string, enabled: boolean
    if (params && typeof params === "object") {
      serverId = params.serverId as string
      enabled = params.enabled as boolean
    } else {
      event.reply("mcp:toggle:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Toggle request:", serverId, enabled)

    try {
      const existing = getMCPServerConfig(serverId)

      if (!existing) {
        event.reply("mcp:toggle:result", {
          success: false,
          error: `MCP server not found: ${serverId}`
        })
        return
      }

      toggleMCPServerEnabled(serverId, enabled)

      // Auto-disconnect if disabling
      if (!enabled) {
        const mcpManager = getMCPManager()
        mcpManager.disconnectServer(serverId).catch((err) => {
          console.error("[MCP] Error disconnecting server:", err)
        })
      }

      event.reply("mcp:toggle:result", {
        success: true,
        enabled
      })
    } catch (error) {
      console.error("[MCP] Toggle error:", error)
      event.reply("mcp:toggle:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Connect to an MCP server
  ipcMain.on("mcp:connect", async (event, params) => {
    console.log("[MCP] Connect request received, params:", params)
    console.log("[MCP] Params type:", typeof params)
    console.log("[MCP] Params keys:", params ? Object.keys(params) : "null")

    // Handle both formats: { serverId } or just serverId as string
    let serverId: string
    if (typeof params === "string") {
      serverId = params
    } else if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:connect:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Extracted serverId:", serverId)

    try {
      const serverConfig = getMCPServerConfig(serverId)

      if (!serverConfig) {
        event.reply("mcp:connect:result", {
          success: false,
          error: `MCP server not found: ${serverId}`
        })
        return
      }

      const mcpManager = getMCPManager()

      const config = {
        id: serverConfig.id,
        name: serverConfig.name,
        type: serverConfig.type,
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        env: serverConfig.env,
        enabled: serverConfig.enabled,
        description: serverConfig.description,
        icon: serverConfig.icon,
        category: serverConfig.category
      }

      const state = await mcpManager.connectServer(config)

      event.reply("mcp:connect:result", {
        success: true,
        state
      })
    } catch (error) {
      console.error("[MCP] Connect error:", error)
      event.reply("mcp:connect:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Disconnect from an MCP server
  ipcMain.on("mcp:disconnect", async (event, params) => {
    console.log("[MCP] Disconnect request received, params:", params)

    // Handle both formats
    let serverId: string
    if (typeof params === "string") {
      serverId = params
    } else if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:disconnect:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Disconnect request:", serverId)

    try {
      const mcpManager = getMCPManager()
      await mcpManager.disconnectServer(serverId)

      event.reply("mcp:disconnect:result", {
        success: true
      })
    } catch (error) {
      console.error("[MCP] Disconnect error:", error)
      event.reply("mcp:disconnect:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get MCP server state (connection status and tools)
  ipcMain.on("mcp:getState", (event, params) => {
    console.log("[MCP] Get state request received, params:", params)

    // Handle both formats
    let serverId: string
    if (typeof params === "string") {
      serverId = params
    } else if (params && typeof params === "object" && "serverId" in params) {
      serverId = params.serverId as string
    } else {
      event.reply("mcp:getState:result", {
        success: false,
        error: `Invalid parameters: ${JSON.stringify(params)}`
      })
      return
    }

    console.log("[MCP] Get state request:", serverId)

    try {
      const mcpManager = getMCPManager()
      const state = mcpManager.getState(serverId)

      if (!state) {
        event.reply("mcp:getState:result", {
          success: false,
          error: `No state found for server: ${serverId}`
        })
        return
      }

      event.reply("mcp:getState:result", {
        success: true,
        state
      })
    } catch (error) {
      console.error("[MCP] Get state error:", error)
      event.reply("mcp:getState:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get all server states
  ipcMain.on("mcp:getAllStates", (event) => {
    console.log("[MCP] Get all states request")

    try {
      const mcpManager = getMCPManager()
      const states = mcpManager.getAllStates()

      event.reply("mcp:getAllStates:result", {
        success: true,
        states
      })
    } catch (error) {
      console.error("[MCP] Get all states error:", error)
      event.reply("mcp:getAllStates:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Test MCP server configuration (without saving)
  ipcMain.on("mcp:test", async (event, params: MCPTestParams) => {
    console.log("[MCP] Test request:", params.type)

    try {
      const mcpManager = getMCPManager()

      const tempId = `test-${Date.now()}`
      const config = {
        id: tempId,
        name: "Test Connection",
        type: params.type,
        command: params.command,
        args: params.args,
        url: params.url,
        env: params.env,
        enabled: true
      }

      const state = await mcpManager.connectServer(config)

      // Disconnect after testing
      await mcpManager.disconnectServer(tempId)

      event.reply("mcp:test:result", {
        success: true,
        tools: state.tools.length
      })
    } catch (error) {
      console.error("[MCP] Test error:", error)
      event.reply("mcp:test:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Export MCP configuration
  ipcMain.on("mcp:export", (event) => {
    console.log("[MCP] Export request")

    try {
      const config = loadMCPConfig()

      // Remove sensitive data for export
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        servers: config.servers.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          command: s.command,
          args: s.args,
          url: s.url,
          enabled: s.enabled,
          description: s.description,
          icon: s.icon,
          category: s.category
          // Note: NOT exporting env (may contain sensitive data)
        }))
      }

      event.reply("mcp:export:result", {
        success: true,
        data: exportData
      })
    } catch (error) {
      console.error("[MCP] Export error:", error)
      event.reply("mcp:export:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Import MCP configuration
  ipcMain.on(
    "mcp:import",
    (
      event,
      {
        data
      }: {
        data: { servers: Array<Omit<MCPServerConfigStorage, "createdAt" | "updatedAt">> }
      }
    ) => {
      console.log("[MCP] Import request:", data.servers.length, "servers")

      try {
        const imported: MCPServerConfigStorage[] = []
        const errors: Array<{ index: number; server: string; error: string }> = []

        for (let i = 0; i < data.servers.length; i++) {
          const serverData = data.servers[i]

          // Check if server ID already exists
          const existing = getMCPServerConfig(serverData.id)

          if (existing) {
            errors.push({
              index: i,
              server: serverData.name,
              error: `Server ID "${serverData.id}" already exists`
            })
            continue
          }

          try {
            const server: MCPServerConfigStorage = {
              ...serverData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            saveMCPServerConfig(server)
            imported.push(server)
          } catch (err) {
            errors.push({
              index: i,
              server: serverData.name,
              error: err instanceof Error ? err.message : "Unknown error"
            })
          }
        }

        event.reply("mcp:import:result", {
          success: true,
          imported: imported.map((s) => ({ id: s.id, name: s.name })),
          total: data.servers.length,
          importedCount: imported.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : undefined
        })
      } catch (error) {
        console.error("[MCP] Import error:", error)
        event.reply("mcp:import:result", {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  )

  console.log("[MCP] Handlers registered successfully")
}
