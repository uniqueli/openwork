import { contextBridge, ipcRenderer } from "electron"
import type {
  Thread,
  ModelConfig,
  Provider,
  StreamEvent,
  HITLDecision,
  CustomApiConfig,
  Skill,
  SkillsConfig
} from "../main/types"

// Helper function for IPC request/response pattern
function ipcRequest<T>(channel: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve) => {
    const responseChannel = `${channel}:result`

    const handler = (_: unknown, result: T) => {
      ipcRenderer.removeListener(responseChannel, handler)
      resolve(result)
    }

    ipcRenderer.once(responseChannel, handler)
    ipcRenderer.send(channel, ...args)
  })
}

// Simple electron API - replaces @electron-toolkit/preload
const electronAPI = {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => listener(...args))
      return () => ipcRenderer.removeListener(channel, listener)
    },
    once: (channel: string, listener: (...args: unknown[]) => void) => {
      ipcRenderer.once(channel, (_event, ...args) => listener(...args))
    },
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
  },
  process: {
    platform: process.platform,
    versions: process.versions
  }
}

// Custom APIs for renderer
const api = {
  agent: {
    // Send message and receive events via callback
    invoke: (
      threadId: string,
      message: string,
      onEvent: (event: StreamEvent) => void,
      modelId?: string
    ): (() => void) => {
      const channel = `agent:stream:${threadId}`

      const handler = (_: unknown, data: StreamEvent): void => {
        onEvent(data)
        if (data.type === "done" || data.type === "error") {
          ipcRenderer.removeListener(channel, handler)
        }
      }

      ipcRenderer.on(channel, handler)
      ipcRenderer.send("agent:invoke", { threadId, message, modelId })

      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, handler)
      }
    },
    // Stream agent events for useStream transport
    streamAgent: (
      threadId: string,
      message: string,
      command: unknown,
      onEvent: (event: StreamEvent) => void,
      modelId?: string
    ): (() => void) => {
      const channel = `agent:stream:${threadId}`

      const handler = (_: unknown, data: StreamEvent): void => {
        onEvent(data)
        if (data.type === "done" || data.type === "error") {
          ipcRenderer.removeListener(channel, handler)
        }
      }

      ipcRenderer.on(channel, handler)

      // If we have a command, it might be a resume/retry
      if (command) {
        ipcRenderer.send("agent:resume", { threadId, command, modelId })
      } else {
        ipcRenderer.send("agent:invoke", { threadId, message, modelId })
      }

      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, handler)
      }
    },
    interrupt: (
      threadId: string,
      decision: HITLDecision,
      onEvent?: (event: StreamEvent) => void
    ): (() => void) => {
      const channel = `agent:stream:${threadId}`

      const handler = (_: unknown, data: StreamEvent): void => {
        onEvent?.(data)
        if (data.type === "done" || data.type === "error") {
          ipcRenderer.removeListener(channel, handler)
        }
      }

      ipcRenderer.on(channel, handler)
      ipcRenderer.send("agent:interrupt", { threadId, decision })

      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, handler)
      }
    },
    cancel: (threadId: string): Promise<void> => {
      return ipcRenderer.invoke("agent:cancel", { threadId })
    }
  },
  threads: {
    list: (): Promise<Thread[]> => {
      return ipcRenderer.invoke("threads:list")
    },
    get: (threadId: string): Promise<Thread | null> => {
      return ipcRenderer.invoke("threads:get", threadId)
    },
    create: (metadata?: Record<string, unknown>): Promise<Thread> => {
      return ipcRenderer.invoke("threads:create", metadata)
    },
    update: (threadId: string, updates: Partial<Thread>): Promise<Thread> => {
      return ipcRenderer.invoke("threads:update", { threadId, updates })
    },
    delete: (threadId: string): Promise<void> => {
      return ipcRenderer.invoke("threads:delete", threadId)
    },
    getHistory: (threadId: string): Promise<unknown[]> => {
      return ipcRenderer.invoke("threads:history", threadId)
    },
    generateTitle: (message: string): Promise<string> => {
      return ipcRenderer.invoke("threads:generateTitle", message)
    }
  },
  models: {
    list: (): Promise<ModelConfig[]> => {
      return ipcRenderer.invoke("models:list")
    },
    listProviders: (): Promise<Provider[]> => {
      return ipcRenderer.invoke("models:listProviders")
    },
    getDefault: (): Promise<string> => {
      return ipcRenderer.invoke("models:getDefault")
    },
    setDefault: (modelId: string): Promise<void> => {
      return ipcRenderer.invoke("models:setDefault", modelId)
    },
    setApiKey: (provider: string, apiKey: string): Promise<void> => {
      return ipcRenderer.invoke("models:setApiKey", { provider, apiKey })
    },
    getApiKey: (provider: string): Promise<string | null> => {
      return ipcRenderer.invoke("models:getApiKey", provider)
    },
    deleteApiKey: (provider: string): Promise<void> => {
      return ipcRenderer.invoke("models:deleteApiKey", provider)
    },
    getCustomApiConfig: (id?: string): Promise<CustomApiConfig | null> => {
      return ipcRenderer.invoke("models:getCustomApiConfig", id)
    },
    getCustomApiConfigs: (): Promise<CustomApiConfig[]> => {
      return ipcRenderer.invoke("models:getCustomApiConfigs")
    },
    setCustomApiConfig: (config: CustomApiConfig): Promise<void> => {
      return ipcRenderer.invoke("models:setCustomApiConfig", config)
    },
    deleteCustomApiConfig: (id?: string): Promise<void> => {
      return ipcRenderer.invoke("models:deleteCustomApiConfig", id)
    }
  },
  workspace: {
    get: (threadId?: string): Promise<string | null> => {
      return ipcRenderer.invoke("workspace:get", threadId)
    },
    set: (threadId: string | undefined, path: string | null): Promise<string | null> => {
      return ipcRenderer.invoke("workspace:set", { threadId, path })
    },
    select: (threadId?: string): Promise<string | null> => {
      return ipcRenderer.invoke("workspace:select", threadId)
    },
    loadFromDisk: (
      threadId: string
    ): Promise<{
      success: boolean
      files: Array<{
        path: string
        is_dir: boolean
        size?: number
        modified_at?: string
      }>
      workspacePath?: string
      error?: string
    }> => {
      return ipcRenderer.invoke("workspace:loadFromDisk", { threadId })
    },
    readFile: (
      threadId: string,
      filePath: string
    ): Promise<{
      success: boolean
      content?: string
      size?: number
      modified_at?: string
      error?: string
    }> => {
      return ipcRenderer.invoke("workspace:readFile", { threadId, filePath })
    },
    readBinaryFile: (
      threadId: string,
      filePath: string
    ): Promise<{
      success: boolean
      content?: string
      size?: number
      modified_at?: string
      error?: string
    }> => {
      return ipcRenderer.invoke("workspace:readBinaryFile", { threadId, filePath })
    },
    // Listen for file changes in the workspace
    onFilesChanged: (
      callback: (data: { threadId: string; workspacePath: string }) => void
    ): (() => void) => {
      const handler = (_: unknown, data: { threadId: string; workspacePath: string }): void => {
        callback(data)
      }
      ipcRenderer.on("workspace:files-changed", handler)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener("workspace:files-changed", handler)
      }
    }
  },
  skills: {
    list: (params?: {
      category?: string
      includeBuiltin?: boolean
      includeUser?: boolean
    }): Promise<{
      success: boolean
      skills?: Array<Skill & { enabled: boolean }>
      error?: string
    }> => {
      return ipcRequest("skills:list", params)
    },
    get: (skillId: string): Promise<{
      success: boolean
      skill?: Skill & { enabled: boolean }
      error?: string
    }> => {
      return ipcRequest("skills:get", { skillId })
    },
    create: (params: {
      name: string
      description: string
      category: string
      prompt: string
      subSkills?: string[]
    }): Promise<{
      success: boolean
      skill?: Skill
      error?: string
    }> => {
      return ipcRequest("skills:create", params)
    },
    update: (params: {
      skillId: string
      name?: string
      description?: string
      category?: string
      prompt?: string
      subSkills?: string[]
    }): Promise<{
      success: boolean
      skill?: Skill
      error?: string
    }> => {
      return ipcRequest("skills:update", params)
    },
    delete: (skillId: string): Promise<{
      success: boolean
      error?: string
    }> => {
      return ipcRequest("skills:delete", { skillId })
    },
    toggle: (skillId: string, enabled: boolean): Promise<{
      success: boolean
      enabled?: boolean
      error?: string
    }> => {
      return ipcRequest("skills:toggle", { skillId, enabled })
    },
    setEnabled: (skillIds: string[]): Promise<{
      success: boolean
      skillIds?: string[]
      error?: string
    }> => {
      return ipcRequest("skills:setEnabled", { skillIds })
    },
    getConfig: (): Promise<{
      success: boolean
      config?: SkillsConfig & { enabledSkills: string[] }
      error?: string
    }> => {
      return ipcRequest("skills:getConfig")
    },
    search: (query: string): Promise<{
      success: boolean
      skills?: Array<Skill & { enabled: boolean }>
      error?: string
    }> => {
      return ipcRequest("skills:search", { query })
    },
    export: (): Promise<{
      success: boolean
      data?: {
        version: string
        exportedAt: string
        skills: Array<{
          id: string
          name: string
          description: string
          category: string
          prompt: string
          subSkills?: string[]
        }>
      }
      error?: string
    }> => {
      return ipcRequest("skills:export")
    },
    import: (data: {
      skills: Array<Omit<Skill, "enabled" | "isBuiltin" | "createdAt" | "updatedAt">>
    }): Promise<{
      success: boolean
      imported?: Array<{ id: string; name: string }>
      error?: string
    }> => {
      return ipcRequest("skills:import", { data })
    },
    getStats: (): Promise<{
      success: boolean
      stats?: {
        total: number
        builtin: number
        user: number
        enabled: number
        byCategory: Record<string, number>
        mostUsed: Array<{ skillId: string; count: number; lastUsed: string }>
      }
      error?: string
    }> => {
      return ipcRequest("skills:getStats")
    },
    recordUsage: (skillId: string): Promise<void> => {
      return ipcRequest("skills:recordUsage", { skillId })
    },
    getUsage: (skillId: string): Promise<{
      success: boolean
      usage?: { skillId: string; count: number; lastUsed: string }
      error?: string
    }> => {
      return ipcRequest("skills:getUsage", { skillId })
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
