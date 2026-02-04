import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs"
import { join } from "path"
import { getSkillsDir, loadSkills } from "../../storage"
import type { Skill } from "../../types"
import { BUILTIN_SKILLS } from "./builtin-skills"

/**
 * Skill file format used by deepagents
 * Skills are stored as SKILL.md files in directories under the skills directory
 */

const SKILLS_FILE_DIR = join(getSkillsDir(), "enabled")

/**
 * Ensure the skills file directory exists
 */
function ensureSkillsDir(): void {
  if (!existsSync(SKILLS_FILE_DIR)) {
    mkdirSync(SKILLS_FILE_DIR, { recursive: true })
  }
}

/**
 * Convert a Skill to SKILL.md format
 * deepagents expects skills in YAML frontmatter + markdown format
 */
function skillToSkillMarkdown(skill: Skill): string {
  return `---
name: ${skill.name}
description: ${skill.description}
category: ${skill.category}
---

# ${skill.name}

${skill.description}

## Specialized Instructions

${skill.prompt}
`
}

/**
 * Save a skill as a SKILL.md file for deepagents to load
 */
export function saveSkillFile(skill: Skill): void {
  ensureSkillsDir()

  const skillDir = join(SKILLS_FILE_DIR, skill.id)
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true })
  }

  const skillFilePath = join(skillDir, "SKILL.md")
  const content = skillToSkillMarkdown(skill)
  writeFileSync(skillFilePath, content, "utf-8")

  console.log(`[SkillFileManager] Saved skill file: ${skillFilePath}`)
}

/**
 * Delete a skill's SKILL.md file
 */
export function deleteSkillFile(skillId: string): void {
  const skillDir = join(SKILLS_FILE_DIR, skillId)
  const skillFilePath = join(skillDir, "SKILL.md")

  if (existsSync(skillFilePath)) {
    unlinkSync(skillFilePath)
    console.log(`[SkillFileManager] Deleted skill file: ${skillFilePath}`)
  }
}

/**
 * Get the skills directory path for deepagents
 * This path should be passed to createDeepAgent's skills parameter
 */
export function getSkillsFileDir(): string {
  ensureSkillsDir()
  return SKILLS_FILE_DIR
}

/**
 * Initialize built-in skills as SKILL.md files
 * This should be called on app startup to ensure built-in skills are available
 */
export function initializeBuiltinSkills(): void {
  ensureSkillsDir()

  for (const skill of BUILTIN_SKILLS) {
    saveSkillFile(skill)
  }

  console.log(`[SkillFileManager] Initialized ${BUILTIN_SKILLS.length} built-in skills`)
}

/**
 * Clear all skill files (useful for reset)
 */
export function clearAllSkillFiles(): void {
  const skillDir = SKILLS_FILE_DIR
  if (!existsSync(skillDir)) {
    return
  }

  // Clear built-in skills
  const builtinSkillIds = BUILTIN_SKILLS.map((s) => s.id)
  for (const skillId of builtinSkillIds) {
    deleteSkillFile(skillId)
  }

  // Also clear user-defined skills from storage
  const userSkills = loadSkills()
  for (const skill of userSkills) {
    deleteSkillFile(skill.id)
  }

  console.log("[SkillFileManager] Cleared all skill files (builtin and user)")
}

/**
 * Sync enabled skills to skill files
 * Only saves skills that are enabled
 */
export function syncEnabledSkills(enabledSkillIds: string[]): void {
  ensureSkillsDir()

  // First, save all built-in skills (they're always available as files)
  for (const skill of BUILTIN_SKILLS) {
    if (enabledSkillIds.includes(skill.id)) {
      saveSkillFile(skill)
    } else {
      deleteSkillFile(skill.id)
    }
  }

  console.log(`[SkillFileManager] Synced ${enabledSkillIds.length} enabled skills`)
}
