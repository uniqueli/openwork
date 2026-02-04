import { IpcMain } from "electron"
import {
  getSkillLoader,
  createUserSkill,
  saveUserSkill,
  deleteUserSkill
} from "../agent/skills/skill-loader"
import {
  getEnabledSkillIds,
  setEnabledSkillIds,
  toggleSkillEnabled,
  loadSkillsConfig,
  recordSkillUsage,
  loadSkillUsageStats
} from "../storage"
import type { Skill } from "../types"
import { syncEnabledSkills } from "../agent/skills/skill-file-manager"

// =============================================================================
// Skills IPC Parameter Types
// =============================================================================

export interface SkillsListParams {
  category?: string
  includeBuiltin?: boolean
  includeUser?: boolean
}

export interface SkillGetParams {
  skillId: string
}

export interface SkillCreateParams {
  name: string
  description: string
  category: string
  prompt: string
  subSkills?: string[]
}

export interface SkillUpdateParams {
  skillId: string
  name?: string
  description?: string
  category?: string
  prompt?: string
  subSkills?: string[]
}

export interface SkillDeleteParams {
  skillId: string
}

export interface SkillToggleParams {
  skillId: string
  enabled: boolean
}

export interface SkillsSetEnabledParams {
  skillIds: string[]
}

export interface SkillsSearchParams {
  query: string
}

// =============================================================================
// Skills IPC Handlers
// =============================================================================

export function registerSkillsHandlers(ipcMain: IpcMain): void {
  console.log("[Skills] Registering skills handlers...")

  // List all skills
  ipcMain.on("skills:list", (event, params?: SkillsListParams) => {
    console.log("[Skills] List request:", params)

    try {
      const loader = getSkillLoader()
      let skills: Skill[] = []

      if (params?.category) {
        skills = loader.getSkillsByCategory(params.category)
      } else {
        skills = loader.getAllSkills()
      }

      // Filter by type if specified
      if (params?.includeBuiltin === false) {
        skills = skills.filter((s) => !s.isBuiltin)
      }
      if (params?.includeUser === false) {
        skills = skills.filter((s) => s.isBuiltin)
      }

      const enabledIds = getEnabledSkillIds()

      // Mark each skill with its enabled status
      const skillsWithStatus = skills.map((skill) => ({
        ...skill,
        enabled: enabledIds.includes(skill.id)
      }))

      event.reply("skills:list:result", {
        success: true,
        skills: skillsWithStatus
      })
    } catch (error) {
      console.error("[Skills] List error:", error)
      event.reply("skills:list:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get a specific skill
  ipcMain.on("skills:get", (event, { skillId }: SkillGetParams) => {
    console.log("[Skills] Get request:", skillId)

    try {
      const loader = getSkillLoader()
      const skill = loader.getSkill(skillId)

      if (!skill) {
        event.reply("skills:get:result", {
          success: false,
          error: `Skill not found: ${skillId}`
        })
        return
      }

      const enabledIds = getEnabledSkillIds()

      event.reply("skills:get:result", {
        success: true,
        skill: {
          ...skill,
          enabled: enabledIds.includes(skill.id)
        }
      })
    } catch (error) {
      console.error("[Skills] Get error:", error)
      event.reply("skills:get:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Create a new user skill
  ipcMain.on("skills:create", (event, params: SkillCreateParams) => {
    console.log("[Skills] Create request:", params.name)

    try {
      const skill = createUserSkill(
        params.name,
        params.description,
        params.category,
        params.prompt,
        params.subSkills
      )

      saveUserSkill(skill)

      event.reply("skills:create:result", {
        success: true,
        skill
      })
    } catch (error) {
      console.error("[Skills] Create error:", error)
      event.reply("skills:create:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Update an existing user skill
  ipcMain.on("skills:update", (event, params: SkillUpdateParams) => {
    console.log("[Skills] Update request:", params.skillId)

    try {
      const loader = getSkillLoader()
      const existing = loader.getSkill(params.skillId)

      if (!existing) {
        event.reply("skills:update:result", {
          success: false,
          error: `Skill not found: ${params.skillId}`
        })
        return
      }

      if (existing.isBuiltin) {
        event.reply("skills:update:result", {
          success: false,
          error: "Cannot modify built-in skills"
        })
        return
      }

      // Update skill with new values
      const updated: Skill = {
        ...existing,
        ...(params.name && { name: params.name }),
        ...(params.description && { description: params.description }),
        ...(params.category && { category: params.category as any }),
        ...(params.prompt && { prompt: params.prompt }),
        ...(params.subSkills && { subSkills: params.subSkills }),
        updatedAt: new Date()
      }

      saveUserSkill(updated)

      event.reply("skills:update:result", {
        success: true,
        skill: updated
      })
    } catch (error) {
      console.error("[Skills] Update error:", error)
      event.reply("skills:update:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Delete a user skill
  ipcMain.on("skills:delete", (event, { skillId }: SkillDeleteParams) => {
    console.log("[Skills] Delete request:", skillId)

    try {
      const loader = getSkillLoader()
      const skill = loader.getSkill(skillId)

      if (!skill) {
        event.reply("skills:delete:result", {
          success: false,
          error: `Skill not found: ${skillId}`
        })
        return
      }

      if (skill.isBuiltin) {
        event.reply("skills:delete:result", {
          success: false,
          error: "Cannot delete built-in skills"
        })
        return
      }

      deleteUserSkill(skillId)

      event.reply("skills:delete:result", {
        success: true
      })
    } catch (error) {
      console.error("[Skills] Delete error:", error)
      event.reply("skills:delete:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Toggle skill enabled state
  ipcMain.on("skills:toggle", (event, { skillId, enabled }: SkillToggleParams) => {
    console.log("[Skills] Toggle request:", skillId, enabled)

    try {
      toggleSkillEnabled(skillId, enabled)

      // Sync to skill files
      const enabledIds = getEnabledSkillIds()
      syncEnabledSkills(enabledIds)

      event.reply("skills:toggle:result", {
        success: true,
        enabled
      })
    } catch (error) {
      console.error("[Skills] Toggle error:", error)
      event.reply("skills:toggle:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Set enabled skills
  ipcMain.on("skills:setEnabled", (event, { skillIds }: SkillsSetEnabledParams) => {
    console.log("[Skills] Set enabled request:", skillIds)

    try {
      setEnabledSkillIds(skillIds)

      // Sync to skill files
      syncEnabledSkills(skillIds)

      event.reply("skills:setEnabled:result", {
        success: true,
        skillIds
      })
    } catch (error) {
      console.error("[Skills] Set enabled error:", error)
      event.reply("skills:setEnabled:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get skills configuration
  ipcMain.on("skills:getConfig", (event) => {
    console.log("[Skills] Get config request")

    try {
      const config = loadSkillsConfig()
      const enabledIds = getEnabledSkillIds()

      event.reply("skills:getConfig:result", {
        success: true,
        config: {
          ...config,
          enabledSkills: enabledIds
        }
      })
    } catch (error) {
      console.error("[Skills] Get config error:", error)
      event.reply("skills:getConfig:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Search skills
  ipcMain.on("skills:search", (event, { query }: SkillsSearchParams) => {
    console.log("[Skills] Search request:", query)

    try {
      const loader = getSkillLoader()
      const skills = loader.searchSkills(query)

      const enabledIds = getEnabledSkillIds()

      const skillsWithStatus = skills.map((skill) => ({
        ...skill,
        enabled: enabledIds.includes(skill.id)
      }))

      event.reply("skills:search:result", {
        success: true,
        skills: skillsWithStatus
      })
    } catch (error) {
      console.error("[Skills] Search error:", error)
      event.reply("skills:search:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Export skills
  ipcMain.on("skills:export", (event) => {
    console.log("[Skills] Export request")

    try {
      const loader = getSkillLoader()
      const userSkills = loader.getUserSkills()

      // Create export data (only user-defined skills)
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        skills: userSkills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          prompt: skill.prompt,
          subSkills: skill.subSkills
        }))
      }

      event.reply("skills:export:result", {
        success: true,
        data: exportData
      })
    } catch (error) {
      console.error("[Skills] Export error:", error)
      event.reply("skills:export:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Import skills
  ipcMain.on("skills:import", (event, { data }: { data: { skills: Array<Omit<Skill, "enabled" | "isBuiltin" | "createdAt" | "updatedAt">> } }) => {
    console.log("[Skills] Import request:", data.skills.length, "skills")

    try {
      const imported: Skill[] = []

      for (const skillData of data.skills) {
        // Create new skill with generated ID
        const skill: Skill = {
          ...skillData,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          enabled: false,
          isBuiltin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        saveUserSkill(skill)
        imported.push(skill)
      }

      // Refresh skill loader
      getSkillLoader().refresh()

      event.reply("skills:import:result", {
        success: true,
        imported: imported.map((s) => ({ id: s.id, name: s.name }))
      })
    } catch (error) {
      console.error("[Skills] Import error:", error)
      event.reply("skills:import:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Get skill statistics
  ipcMain.on("skills:getStats", (event) => {
    console.log("[Skills] Get stats request")

    try {
      const loader = getSkillLoader()
      const allSkills = loader.getAllSkills()
      const enabledIds = getEnabledSkillIds()
      const usageStats = loadSkillUsageStats()

      // Calculate statistics
      const stats = {
        total: allSkills.length,
        builtin: allSkills.filter((s) => s.isBuiltin).length,
        user: allSkills.filter((s) => !s.isBuiltin).length,
        enabled: enabledIds.length,
        byCategory: allSkills.reduce((acc, skill) => {
          acc[skill.category] = (acc[skill.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        mostUsed: Object.values(usageStats)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((s) => ({ skillId: s.skillId, count: s.count, lastUsed: s.lastUsed }))
      }

      event.reply("skills:getStats:result", {
        success: true,
        stats
      })
    } catch (error) {
      console.error("[Skills] Get stats error:", error)
      event.reply("skills:getStats:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Record skill usage
  ipcMain.on("skills:recordUsage", (_event, { skillId }: { skillId: string }) => {
    console.log("[Skills] Record usage:", skillId)
    try {
      recordSkillUsage(skillId)
    } catch (error) {
      console.error("[Skills] Record usage error:", error)
    }
  })

  // Get skill usage
  ipcMain.on("skills:getUsage", (event, { skillId }: { skillId: string }) => {
    console.log("[Skills] Get usage request:", skillId)

    try {
      const usage = loadSkillUsageStats()[skillId]

      event.reply("skills:getUsage:result", {
        success: true,
        usage: usage || { skillId, count: 0, lastUsed: "" }
      })
    } catch (error) {
      console.error("[Skills] Get usage error:", error)
      event.reply("skills:getUsage:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  console.log("[Skills] Handlers registered successfully")
}
