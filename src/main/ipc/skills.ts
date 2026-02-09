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
import { validateSkillData, sanitizePrompt } from "../agent/skills/validation"
import {
  SKILL_ERRORS,
  wrapSkillError,
  parseValidationError
} from "../agent/skills/error-handler"

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
  version?: string // Optional version, defaults to "1.0.0"
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
      // Validate input data
      const validation = validateSkillData({
        name: params.name,
        description: params.description,
        category: params.category,
        prompt: params.prompt,
        subSkills: params.subSkills
      })

      if (!validation.valid) {
        event.reply("skills:create:result", {
          success: false,
          error: validation.error || "Validation failed",
          field: validation.field
        })
        return
      }

      // Sanitize prompt
      const sanitizedPrompt = sanitizePrompt(params.prompt)

      const skill = createUserSkill(
        params.name,
        params.description,
        params.category,
        sanitizedPrompt,
        params.subSkills,
        params.version
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
        const skillError = SKILL_ERRORS.SKILL_NOT_FOUND(params.skillId)
        event.reply("skills:update:result", {
          success: false,
          error: skillError.message,
          details: skillError.details,
          recovery: skillError.recovery
        })
        return
      }

      if (existing.isBuiltin) {
        event.reply("skills:update:result", {
          success: false,
          error: SKILL_ERRORS.CANNOT_MODIFY_BUILTIN.message,
          details: SKILL_ERRORS.CANNOT_MODIFY_BUILTIN.details,
          recovery: SKILL_ERRORS.CANNOT_MODIFY_BUILTIN.recovery
        })
        return
      }

      // Build updated skill data for validation
      const updatedData = {
        name: params.name || existing.name,
        description: params.description || existing.description,
        category: params.category || existing.category,
        prompt: params.prompt || existing.prompt,
        subSkills: params.subSkills !== undefined ? params.subSkills : existing.subSkills
      }

      // Validate updated data
      const validation = validateSkillData(updatedData)
      if (!validation.valid) {
        const error = parseValidationError(validation.error)
        event.reply("skills:update:result", {
          success: false,
          error: error.message,
          field: error.field,
          details: error.details,
          recovery: error.recovery
        })
        return
      }

      // Update skill with new values (sanitizing prompt if provided)
      const updated: Skill = {
        ...existing,
        ...(params.name && { name: params.name }),
        ...(params.description && { description: params.description }),
        ...(params.category && { category: params.category as Skill["category"] }),
        ...(params.prompt && { prompt: sanitizePrompt(params.prompt) }),
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
      const wrappedError = wrapSkillError(error, "更新技能失败")
      event.reply("skills:update:result", {
        success: false,
        error: wrappedError.message,
        details: wrappedError.details,
        recovery: wrappedError.recovery
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
  ipcMain.on("skills:toggle", async (event, { skillId, enabled }: SkillToggleParams) => {
    console.log("[Skills] Toggle request:", skillId, enabled)

    try {
      toggleSkillEnabled(skillId, enabled)

      // Sync to skill files (now async)
      const enabledIds = getEnabledSkillIds()
      await syncEnabledSkills(enabledIds)

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
  ipcMain.on("skills:setEnabled", async (event, { skillIds }: SkillsSetEnabledParams) => {
    console.log("[Skills] Set enabled request:", skillIds)

    try {
      setEnabledSkillIds(skillIds)

      // Sync to skill files (now async)
      await syncEnabledSkills(skillIds)

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
  ipcMain.on(
    "skills:import",
    (
      event,
      {
        data
      }: {
        data: { skills: Array<Omit<Skill, "enabled" | "isBuiltin" | "createdAt" | "updatedAt">> }
      }
    ) => {
      console.log("[Skills] Import request:", data.skills.length, "skills")

      try {
        const imported: Skill[] = []
        const errors: Array<{ index: number; skill: string; error: string }> = []

        for (let i = 0; i < data.skills.length; i++) {
          const skillData = data.skills[i]

          // Validate imported skill
          const validation = validateSkillData({
            name: skillData.name,
            description: skillData.description,
            category: skillData.category,
            prompt: skillData.prompt,
            subSkills: skillData.subSkills
          })

          if (!validation.valid) {
            errors.push({
              index: i,
              skill: skillData.name,
              error: validation.error || "Validation failed"
            })
            continue
          }

          // Create new skill with generated ID
          const skill: Skill = {
            ...skillData,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt: sanitizePrompt(skillData.prompt), // Sanitize prompt
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

        // Return result with any validation errors
        event.reply("skills:import:result", {
          success: true,
          imported: imported.map((s) => ({ id: s.id, name: s.name })),
          total: data.skills.length,
          importedCount: imported.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : undefined
        })
      } catch (error) {
        console.error("[Skills] Import error:", error)
        event.reply("skills:import:result", {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  )

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
        byCategory: allSkills.reduce(
          (acc, skill) => {
            acc[skill.category] = (acc[skill.category] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
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

  // Get cache statistics
  ipcMain.on("skills:getCacheStats", (event) => {
    console.log("[Skills] Get cache stats request")

    try {
      const loader = getSkillLoader()
      const stats = loader.getCacheStats()

      event.reply("skills:getCacheStats:result", {
        success: true,
        stats
      })
    } catch (error) {
      console.error("[Skills] Get cache stats error:", error)
      event.reply("skills:getCacheStats:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Clear cache
  ipcMain.on("skills:clearCache", (event) => {
    console.log("[Skills] Clear cache request")

    try {
      const loader = getSkillLoader()
      loader.clearCache()

      event.reply("skills:clearCache:result", {
        success: true
      })
    } catch (error) {
      console.error("[Skills] Clear cache error:", error)
      event.reply("skills:clearCache:result", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  console.log("[Skills] Handlers registered successfully")
}
