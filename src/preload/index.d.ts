import type {
  Thread,
  ModelConfig,
  Provider,
  StreamEvent,
  HITLDecision,
  Skill,
  SkillsConfig,
  MCPClientState
} from "../main/types"
import type { MCPServerConfigStorage } from "../main/storage"

interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => void
    on: (channel: string, listener: (...args: unknown[]) => void) => () => void
    once: (channel: string, listener: (...args: unknown[]) => void) => void
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  }
  process: {
    platform: NodeJS.Platform
    versions: NodeJS.ProcessVersions
  }
}

interface CustomAPI {
  agent: {
    invoke: (
      threadId: string,
      message: string,
      onEvent: (event: StreamEvent) => void,
      modelId?: string
    ) => () => void
    streamAgent: (
      threadId: string,
      message: string,
      command: unknown,
      onEvent: (event: StreamEvent) => void,
      modelId?: string
    ) => () => void
    interrupt: (
      threadId: string,
      decision: HITLDecision,
      onEvent?: (event: StreamEvent) => void
    ) => () => void
    cancel: (threadId: string) => Promise<void>
  }
  threads: {
    list: () => Promise<Thread[]>
    get: (threadId: string) => Promise<Thread | null>
    create: (metadata?: Record<string, unknown>) => Promise<Thread>
    update: (threadId: string, updates: Partial<Thread>) => Promise<Thread>
    delete: (threadId: string) => Promise<void>
    getHistory: (threadId: string) => Promise<unknown[]>
    generateTitle: (message: string) => Promise<string>
  }
  models: {
    list: () => Promise<ModelConfig[]>
    listProviders: () => Promise<Provider[]>
    getDefault: () => Promise<string>
    deleteApiKey: (provider: string) => Promise<void>
    setDefault: (modelId: string) => Promise<void>
    setApiKey: (provider: string, apiKey: string) => Promise<void>
    getApiKey: (provider: string) => Promise<string | null>
    getCustomApiConfig: (id?: string) => Promise<{
      id: string
      name: string
      baseUrl: string
      apiKey: string
      model?: string
    } | null>
    getCustomApiConfigs: () => Promise<
      Array<{ id: string; name: string; baseUrl: string; apiKey: string; model?: string }>
    >
    setCustomApiConfig: (config: {
      id: string
      name: string
      baseUrl: string
      apiKey: string
      model?: string
    }) => Promise<void>
    deleteCustomApiConfig: (id?: string) => Promise<void>
  }
  workspace: {
    get: (threadId?: string) => Promise<string | null>
    set: (threadId: string | undefined, path: string | null) => Promise<string | null>
    select: (threadId?: string) => Promise<string | null>
    loadFromDisk: (threadId: string) => Promise<{
      success: boolean
      files: Array<{
        path: string
        is_dir: boolean
        size?: number
        modified_at?: string
      }>
      workspacePath?: string
      error?: string
    }>
    readFile: (
      threadId: string,
      filePath: string
    ) => Promise<{
      success: boolean
      content?: string
      size?: number
      modified_at?: string
      error?: string
    }>
    readBinaryFile: (
      threadId: string,
      filePath: string
    ) => Promise<{
      success: boolean
      content?: string
      size?: number
      modified_at?: string
      error?: string
    }>
    onFilesChanged: (
      callback: (data: { threadId: string; workspacePath: string }) => void
    ) => () => void
  }
  skills: {
    list: (params?: {
      category?: string
      includeBuiltin?: boolean
      includeUser?: boolean
    }) => Promise<{
      success: boolean
      skills?: Array<Skill & { enabled: boolean }>
      error?: string
    }>
    get: (skillId: string) => Promise<{
      success: boolean
      skill?: Skill & { enabled: boolean }
      error?: string
    }>
    create: (params: {
      name: string
      description: string
      category: string
      prompt: string
      subSkills?: string[]
    }) => Promise<{
      success: boolean
      skill?: Skill
      error?: string
    }>
    update: (params: {
      skillId: string
      name?: string
      description?: string
      category?: string
      prompt?: string
      subSkills?: string[]
    }) => Promise<{
      success: boolean
      skill?: Skill
      error?: string
    }>
    delete: (skillId: string) => Promise<{
      success: boolean
      error?: string
    }>
    toggle: (
      skillId: string,
      enabled: boolean
    ) => Promise<{
      success: boolean
      enabled?: boolean
      error?: string
    }>
    setEnabled: (skillIds: string[]) => Promise<{
      success: boolean
      skillIds?: string[]
      error?: string
    }>
    getConfig: () => Promise<{
      success: boolean
      config?: SkillsConfig & { enabledSkills: string[] }
      error?: string
    }>
    search: (query: string) => Promise<{
      success: boolean
      skills?: Array<Skill & { enabled: boolean }>
      error?: string
    }>
    export: () => Promise<{
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
    }>
    import: (data: {
      skills: Array<Omit<Skill, "enabled" | "isBuiltin" | "createdAt" | "updatedAt">>
    }) => Promise<{
      success: boolean
      imported?: Array<{ id: string; name: string }>
      error?: string
    }>
    getStats: () => Promise<{
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
    }>
    recordUsage: (skillId: string) => Promise<void>
    getUsage: (skillId: string) => Promise<{
      success: boolean
      usage?: { skillId: string; count: number; lastUsed: string }
      error?: string
    }>
  }
  mcp: {
    list: (params?: {
      enabledOnly?: boolean
    }) => Promise<{
      success: boolean
      servers?: MCPServerConfigStorage[]
      error?: string
    }>
    get: (
      serverId: string
    ) => Promise<{
      success: boolean
      server?: MCPServerConfigStorage
      error?: string
    }>
    create: (params: {
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
    }) => Promise<{
      success: boolean
      server?: MCPServerConfigStorage
      error?: string
    }>
    update: (params: {
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
    }) => Promise<{
      success: boolean
      server?: MCPServerConfigStorage
      error?: string
    }>
    delete: (
      serverId: string
    ) => Promise<{
      success: boolean
      error?: string
    }>
    toggle: (
      serverId: string,
      enabled: boolean
    ) => Promise<{
      success: boolean
      enabled?: boolean
      error?: string
    }>
    connect: (
      serverId: string
    ) => Promise<{
      success: boolean
      state?: MCPClientState
      error?: string
    }>
    disconnect: (
      serverId: string
    ) => Promise<{
      success: boolean
      error?: string
    }>
    getState: (
      serverId: string
    ) => Promise<{
      success: boolean
      state?: MCPClientState
      error?: string
    }>
    getAllStates: () => Promise<{
      success: boolean
      states?: MCPClientState[]
      error?: string
    }>
    test: (params: {
      type: "stdio" | "sse"
      command?: string
      args?: string[]
      url?: string
      env?: Record<string, string>
    }) => Promise<{
      success: boolean
      tools?: number
      error?: string
    }>
    export: () => Promise<{
      success: boolean
      data?: {
        version: string
        exportedAt: string
        servers: Array<{
          id: string
          name: string
          type: "stdio" | "sse"
          command?: string
          args?: string[]
          url?: string
          enabled: boolean
          description?: string
          icon?: string
          category?: string
        }>
      }
      error?: string
    }>
    import: (data: {
      servers: Array<{
        id: string
        name: string
        type: "stdio" | "sse"
        command?: string
        args?: string[]
        url?: string
        enabled: boolean
        description?: string
        icon?: string
        category?: string
      }>
    }) => Promise<{
      success: boolean
      imported?: Array<{ id: string; name: string }>
      total?: number
      importedCount?: number
      errorCount?: number
      errors?: Array<{ index: number; server: string; error: string }>
      error?: string
    }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
