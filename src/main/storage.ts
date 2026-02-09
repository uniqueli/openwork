import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs"

const OPENWORK_DIR = join(homedir(), ".openwork")
const ENV_FILE = join(OPENWORK_DIR, ".env")

// Environment variable names for each provider
const ENV_VAR_NAMES: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  ollama: "" // Ollama doesn't require an API key
  // Custom providers have their own env var pattern
}

export function getOpenworkDir(): string {
  if (!existsSync(OPENWORK_DIR)) {
    mkdirSync(OPENWORK_DIR, { recursive: true })
  }
  return OPENWORK_DIR
}

export function getDbPath(): string {
  return join(getOpenworkDir(), "openwork.sqlite")
}

export function getCheckpointDbPath(): string {
  return join(getOpenworkDir(), "langgraph.sqlite")
}

export function getThreadCheckpointDir(): string {
  const dir = join(getOpenworkDir(), "threads")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getThreadCheckpointPath(threadId: string): string {
  return join(getThreadCheckpointDir(), `${threadId}.sqlite`)
}

export function deleteThreadCheckpoint(threadId: string): void {
  const path = getThreadCheckpointPath(threadId)
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function getEnvFilePath(): string {
  return ENV_FILE
}

// Read .env file and parse into object
function parseEnvFile(): Record<string, string> {
  const envPath = getEnvFilePath()
  if (!existsSync(envPath)) return {}

  const content = readFileSync(envPath, "utf-8")
  const result: Record<string, string> = {}

  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      result[key] = value
    }
  }
  return result
}

// Write object back to .env file
function writeEnvFile(env: Record<string, string>): void {
  getOpenworkDir() // ensure dir exists
  const lines = Object.entries(env)
    .filter((entry) => entry[1])
    .map(([k, v]) => `${k}=${v}`)
  writeFileSync(getEnvFilePath(), lines.join("\n") + "\n")
}

// API key management
export function getApiKey(provider: string): string | undefined {
  const envVarName = ENV_VAR_NAMES[provider]
  if (!envVarName) return undefined

  // Check .env file first
  const env = parseEnvFile()
  if (env[envVarName]) return env[envVarName]

  // Fall back to process environment
  return process.env[envVarName]
}

export function setApiKey(provider: string, apiKey: string): void {
  const envVarName = ENV_VAR_NAMES[provider]
  if (!envVarName) return

  const env = parseEnvFile()
  env[envVarName] = apiKey
  writeEnvFile(env)

  // Also set in process.env for current session
  process.env[envVarName] = apiKey
}

export function deleteApiKey(provider: string): void {
  const envVarName = ENV_VAR_NAMES[provider]
  if (!envVarName) return

  const env = parseEnvFile()
  delete env[envVarName]
  writeEnvFile(env)

  // Also clear from process.env
  delete process.env[envVarName]
}

export function hasApiKey(provider: string): boolean {
  return !!getApiKey(provider)
}

// Custom API configuration management
export interface CustomApiConfig {
  id: string // Unique identifier (e.g., "moonshot", "zhipu", "custom-1")
  name: string // Display name (e.g., "Moonshot AI", "Zhipu AI")
  baseUrl: string
  apiKey: string
  model?: string
}

// Get all custom API configurations
export function getCustomApiConfigs(): CustomApiConfig[] {
  const env = parseEnvFile()
  const configs: CustomApiConfig[] = []
  const processedIds = new Set<string>()

  // Find all custom API configs by looking for CUSTOM_API_{ID}_BASE_URL pattern
  for (const key of Object.keys(env)) {
    const match = key.match(/^CUSTOM_API_(.+)_BASE_URL$/)
    if (match) {
      const id = match[1].toLowerCase()
      if (processedIds.has(id)) continue
      processedIds.add(id)

      const baseUrl = env[`CUSTOM_API_${match[1]}_BASE_URL`]?.trim()
      const apiKey = env[`CUSTOM_API_${match[1]}_API_KEY`]?.trim()
      const name = env[`CUSTOM_API_${match[1]}_NAME`]?.trim()
      const model = env[`CUSTOM_API_${match[1]}_MODEL`]?.trim()

      if (baseUrl && apiKey) {
        configs.push({
          id,
          name: name || id,
          baseUrl,
          apiKey,
          model
        })
      }
    }
  }

  // Backward compatibility: check for legacy single custom config
  if (env.CUSTOM_BASE_URL && env.CUSTOM_API_KEY && !processedIds.has("custom")) {
    configs.push({
      id: "custom",
      name: env.CUSTOM_NAME?.trim() || "Custom API",
      baseUrl: env.CUSTOM_BASE_URL.trim(),
      apiKey: env.CUSTOM_API_KEY.trim(),
      model: env.CUSTOM_MODEL?.trim()
    })
  }

  return configs
}

// Get a specific custom API configuration by ID
export function getCustomApiConfig(id?: string): CustomApiConfig | undefined {
  const configs = getCustomApiConfigs()

  // If no ID specified, return the first config (backward compatibility)
  if (!id) {
    return configs[0]
  }

  return configs.find((c) => c.id === id)
}

// Set/update a custom API configuration
export function setCustomApiConfig(config: CustomApiConfig): void {
  const env = parseEnvFile()
  const idUpper = config.id.toUpperCase()

  // Use new format: CUSTOM_API_{ID}_*
  env[`CUSTOM_API_${idUpper}_BASE_URL`] = config.baseUrl
  env[`CUSTOM_API_${idUpper}_API_KEY`] = config.apiKey
  env[`CUSTOM_API_${idUpper}_NAME`] = config.name

  if (config.model) {
    env[`CUSTOM_API_${idUpper}_MODEL`] = config.model
  } else {
    delete env[`CUSTOM_API_${idUpper}_MODEL`]
  }

  writeEnvFile(env)

  // Also set in process.env for current session
  process.env[`CUSTOM_API_${idUpper}_BASE_URL`] = config.baseUrl
  process.env[`CUSTOM_API_${idUpper}_API_KEY`] = config.apiKey
  process.env[`CUSTOM_API_${idUpper}_NAME`] = config.name
  if (config.model) {
    process.env[`CUSTOM_API_${idUpper}_MODEL`] = config.model
  }
}

// Delete a specific custom API configuration
export function deleteCustomApiConfig(id?: string): void {
  const env = parseEnvFile()

  if (!id) {
    // Delete legacy format for backward compatibility
    delete env.CUSTOM_BASE_URL
    delete env.CUSTOM_API_KEY
    delete env.CUSTOM_NAME
    delete env.CUSTOM_MODEL
    delete process.env.CUSTOM_BASE_URL
    delete process.env.CUSTOM_API_KEY
    delete process.env.CUSTOM_NAME
    delete process.env.CUSTOM_MODEL
  } else {
    const idUpper = id.toUpperCase()
    delete env[`CUSTOM_API_${idUpper}_BASE_URL`]
    delete env[`CUSTOM_API_${idUpper}_API_KEY`]
    delete env[`CUSTOM_API_${idUpper}_NAME`]
    delete env[`CUSTOM_API_${idUpper}_MODEL`]

    delete process.env[`CUSTOM_API_${idUpper}_BASE_URL`]
    delete process.env[`CUSTOM_API_${idUpper}_API_KEY`]
    delete process.env[`CUSTOM_API_${idUpper}_NAME`]
    delete process.env[`CUSTOM_API_${idUpper}_MODEL`]
  }

  writeEnvFile(env)
}

// Check if any custom API configuration exists
export function hasCustomApiConfig(): boolean {
  return getCustomApiConfigs().length > 0
}

// =============================================================================
// Skills storage
// =============================================================================

export function getSkillsDir(): string {
  const dir = join(getOpenworkDir(), "skills")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getUserSkillsFilePath(): string {
  return join(getSkillsDir(), "user-skills.json")
}

export interface SkillStorage {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  subSkills?: string[]
  enabled: boolean
  isBuiltin: boolean
  version: string // Semantic version
  createdAt: string
  updatedAt: string
}

// Load all skills (both built-in and user-defined)
export function loadSkills(): SkillStorage[] {
  const userSkillsPath = getUserSkillsFilePath()

  let userSkills: SkillStorage[] = []
  if (existsSync(userSkillsPath)) {
    try {
      const content = readFileSync(userSkillsPath, "utf-8")
      userSkills = JSON.parse(content)
    } catch (error) {
      console.error("[Storage] Failed to load user skills:", error)
    }
  }

  return userSkills
}

// Save user-defined skills
export function saveUserSkills(skills: SkillStorage[]): void {
  const userSkillsPath = getUserSkillsFilePath()
  getSkillsDir() // ensure dir exists
  writeFileSync(userSkillsPath, JSON.stringify(skills, null, 2) + "\n")
}

// Get a specific skill by ID
export function getSkill(id: string): SkillStorage | undefined {
  const skills = loadSkills()
  return skills.find((s) => s.id === id)
}

// Add or update a user-defined skill
export function saveSkill(skill: SkillStorage): void {
  const skills = loadSkills()
  const existingIndex = skills.findIndex((s) => s.id === skill.id)

  if (existingIndex >= 0) {
    // Update existing skill
    skills[existingIndex] = skill
  } else {
    // Add new skill
    skills.push(skill)
  }

  saveUserSkills(skills)
}

// Delete a user-defined skill
export function deleteSkill(id: string): void {
  const skills = loadSkills()
  const filtered = skills.filter((s) => s.id !== id)
  saveUserSkills(filtered)
}

// Skills configuration
export function getSkillsConfigPath(): string {
  return join(getOpenworkDir(), "skills-config.json")
}

export interface SkillsConfigStorage {
  enabledSkills: string[]
  autoLoad: boolean
}

export function loadSkillsConfig(): SkillsConfigStorage {
  const configPath = getSkillsConfigPath()
  if (!existsSync(configPath)) {
    // Return default config
    return {
      enabledSkills: [],
      autoLoad: false
    }
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.error("[Storage] Failed to load skills config:", error)
    return {
      enabledSkills: [],
      autoLoad: false
    }
  }
}

export function saveSkillsConfig(config: SkillsConfigStorage): void {
  const configPath = getSkillsConfigPath()
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
}

// Get enabled skill IDs
export function getEnabledSkillIds(): string[] {
  const config = loadSkillsConfig()
  return config.enabledSkills
}

// Set enabled skill IDs
export function setEnabledSkillIds(ids: string[]): void {
  const config = loadSkillsConfig()
  config.enabledSkills = ids
  saveSkillsConfig(config)
}

// Toggle a skill enabled state
export function toggleSkillEnabled(skillId: string, enabled: boolean): void {
  const enabledIds = getEnabledSkillIds()
  const index = enabledIds.indexOf(skillId)

  if (enabled && index < 0) {
    enabledIds.push(skillId)
  } else if (!enabled && index >= 0) {
    enabledIds.splice(index, 1)
  }

  setEnabledSkillIds(enabledIds)
}

// =============================================================================
// Skills Usage Statistics
// =============================================================================

export interface SkillUsageStats {
  skillId: string
  count: number
  lastUsed: string
}

export function getSkillUsageStatsPath(): string {
  return join(getOpenworkDir(), "skills-usage.json")
}

export function loadSkillUsageStats(): Record<string, SkillUsageStats> {
  const statsPath = getSkillUsageStatsPath()
  if (!existsSync(statsPath)) {
    return {}
  }

  try {
    const content = readFileSync(statsPath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.error("[Storage] Failed to load skill usage stats:", error)
    return {}
  }
}

export function saveSkillUsageStats(stats: Record<string, SkillUsageStats>): void {
  const statsPath = getSkillUsageStatsPath()
  writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n")
}

export function recordSkillUsage(skillId: string): void {
  const stats = loadSkillUsageStats()
  const now = new Date().toISOString()

  if (stats[skillId]) {
    stats[skillId].count += 1
    stats[skillId].lastUsed = now
  } else {
    stats[skillId] = {
      skillId,
      count: 1,
      lastUsed: now
    }
  }

  saveSkillUsageStats(stats)
}

export function getSkillUsageStats(skillId: string): SkillUsageStats | undefined {
  const stats = loadSkillUsageStats()
  return stats[skillId]
}
