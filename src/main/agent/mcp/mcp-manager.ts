/**
 * MCP (Model Context Protocol) Manager
 *
 * Manages MCP server connections and tool integration.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import type {
  MCPServerConfig,
  MCPClientState,
  MCPTool
} from "../../types.js"

// =============================================================================
// MCP Manager Class
// =============================================================================

export class MCPManager {
  private clients: Map<string, Client> = new Map()
  private states: Map<string, MCPClientState> = new Map()
  private tools: Map<string, DynamicStructuredTool> = new Map()

  // -------------------------------------------------------------------------
  // Server Connection Management
  // -------------------------------------------------------------------------

  /**
   * Connect to an MCP server
   */
  async connectServer(config: MCPServerConfig): Promise<MCPClientState> {
    console.log(`[MCP] Connecting to server: ${config.name} (${config.id})`)

    // Update state to connecting
    this.updateState(config.id, {
      serverId: config.id,
      status: "connecting",
      tools: []
    })

    try {
      let client: Client
      let transport: StdioClientTransport | SSEClientTransport

      if (config.type === "stdio") {
        // Stdio transport
        if (!config.command) {
          throw new Error("Stdio server requires 'command' field")
        }

        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env
        })
      } else {
        // SSE transport
        if (!config.url) {
          throw new Error("SSE server requires 'url' field")
        }

        transport = new SSEClientTransport(new URL(config.url))
      }

      // Create and connect client
      client = new Client({
        name: `openwork-${config.id}`,
        version: "1.0.0"
      })

      await client.connect(transport)

      // Store client
      this.clients.set(config.id, client)

      // List available tools
      const toolsList = await client.listTools()

      // Convert tools to LangChain format
      const mcpTools: MCPTool[] = (toolsList.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.inputSchema as Record<string, unknown>,
        serverId: config.id
      }))

      // Create LangChain tools
      for (const mcpTool of mcpTools) {
        const langchainTool = this.createLangChainTool(mcpTool, client)
        this.tools.set(`${config.id}:${mcpTool.name}`, langchainTool)
      }

      // Update state to connected
      const state: MCPClientState = {
        serverId: config.id,
        status: "connected",
        tools: mcpTools,
        connectedAt: new Date(),
        lastHeartbeat: new Date()
      }

      this.states.set(config.id, state)

      console.log(`[MCP] Connected to ${config.name}, loaded ${mcpTools.length} tools`)

      return state
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      // Update state to error
      this.updateState(config.id, {
        serverId: config.id,
        status: "error",
        tools: [],
        error: errorMessage
      })

      console.error(`[MCP] Failed to connect to ${config.name}:`, errorMessage)

      throw error
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(serverId: string): Promise<void> {
    console.log(`[MCP] Disconnecting server: ${serverId}`)

    const client = this.clients.get(serverId)
    if (client) {
      try {
        await client.close()
      } catch (error) {
        console.error(`[MCP] Error closing client for ${serverId}:`, error)
      }

      this.clients.delete(serverId)
    }

    // Remove tools
    for (const toolKey of this.tools.keys()) {
      if (toolKey.startsWith(`${serverId}:`)) {
        this.tools.delete(toolKey)
      }
    }

    // Update state
    this.updateState(serverId, {
      serverId,
      status: "disconnected",
      tools: []
    })
  }

  /**
   * Disconnect all servers
   */
  async disconnectAll(): Promise<void> {
    console.log("[MCP] Disconnecting all servers")

    const disconnectPromises = Array.from(this.clients.keys()).map((serverId) =>
      this.disconnectServer(serverId)
    )

    await Promise.all(disconnectPromises)
  }

  // -------------------------------------------------------------------------
  // Tool Management
  // -------------------------------------------------------------------------

  /**
   * Get all LangChain tools from all connected MCP servers
   */
  getAllTools(): DynamicStructuredTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools from a specific server
   */
  getServerTools(serverId: string): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = []

    for (const [toolKey, tool] of this.tools.entries()) {
      if (toolKey.startsWith(`${serverId}:`)) {
        tools.push(tool)
      }
    }

    return tools
  }

  /**
   * Get state for all servers
   */
  getAllStates(): MCPClientState[] {
    return Array.from(this.states.values())
  }

  /**
   * Get state for a specific server
   */
  getState(serverId: string): MCPClientState | undefined {
    return this.states.get(serverId)
  }

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------

  /**
   * Update client state
   */
  private updateState(serverId: string, updates: Partial<MCPClientState>): void {
    const existing = this.states.get(serverId)
    if (existing) {
      this.states.set(serverId, { ...existing, ...updates })
    } else {
      this.states.set(serverId, {
        serverId,
        status: "disconnected",
        tools: [],
        ...updates
      } as MCPClientState)
    }
  }

  /**
   * Create a LangChain DynamicStructuredTool from an MCP tool
   */
  private createLangChainTool(mcpTool: MCPTool, client: Client): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: this.sanitizeToolName(`${mcpTool.serverId}_${mcpTool.name}`),
      description: mcpTool.description,
      func: async (input: Record<string, unknown>) => {
        try {
          const result = await client.callTool({
            name: mcpTool.name,
            arguments: input
          })

          return this.formatToolResult(result)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          console.error(`[MCP] Tool call error (${mcpTool.name}):`, errorMessage)
          return `Error: ${errorMessage}`
        }
      },
      schema: this.createZodSchema(mcpTool.inputSchema)
    })
  }

  /**
   * Sanitize tool name for LangChain (alphanumeric, underscore, hyphen only)
   */
  private sanitizeToolName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_")
  }

  /**
   * Create a Zod schema from MCP input schema
   */
  private createZodSchema(inputSchema: Record<string, unknown>): z.ZodType<any> {
    // Simplified schema generation - in production, you'd want a full JSON Schema to Zod converter
    const properties = (inputSchema.properties as Record<string, unknown>) || {}
    const required = (inputSchema.required as string[]) || []

    const shape: Record<string, z.ZodTypeAny> = {}

    for (const [propName, propDef] of Object.entries(properties)) {
      const def = propDef as { type?: string; description?: string }

      if (def.type === "string") {
        shape[propName] = z.string()
      } else if (def.type === "number") {
        shape[propName] = z.number()
      } else if (def.type === "boolean") {
        shape[propName] = z.boolean()
      } else if (def.type === "array") {
        shape[propName] = z.array(z.any())
      } else {
        shape[propName] = z.any()
      }

      // Make optional if not required
      if (!required.includes(propName)) {
        shape[propName] = shape[propName].optional()
      }
    }

    return z.object(shape)
  }

  /**
   * Format tool call result
   */
  private formatToolResult(result: any): string {
    if (!result.content) {
      return "Tool returned no content"
    }

    const contents = Array.isArray(result.content) ? result.content : [result.content]

    const textParts = contents
      .filter((item) => item.type === "text")
      .map((item) => (item as { text?: string }).text || "")
      .filter(Boolean)

    if (textParts.length === 0) {
      return "Tool returned non-text content"
    }

    return textParts.join("\n")
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let mcpManagerInstance: MCPManager | null = null

export function getMCPManager(): MCPManager {
  if (!mcpManagerInstance) {
    mcpManagerInstance = new MCPManager()
  }
  return mcpManagerInstance
}

export function resetMCPManager(): void {
  mcpManagerInstance = null
}
