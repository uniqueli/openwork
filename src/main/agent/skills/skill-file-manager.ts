import { existsSync, mkdirSync } from "fs"
import { writeFile, unlink, mkdir } from "fs/promises"
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
 * Ensure the skills file directory exists (sync for initialization)
 */
function ensureSkillsDir(): void {
  if (!existsSync(SKILLS_FILE_DIR)) {
    mkdirSync(SKILLS_FILE_DIR, { recursive: true })
  }
}

/**
 * Ensure the skills file directory exists (async version)
 */
async function ensureSkillsDirAsync(): Promise<void> {
  try {
    await mkdir(SKILLS_FILE_DIR, { recursive: true })
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error
    }
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
export async function saveSkillFile(skill: Skill): Promise<void> {
  await ensureSkillsDirAsync()

  const skillDir = join(SKILLS_FILE_DIR, skill.id)

  // Create skill directory if it doesn't exist
  try {
    await mkdir(skillDir, { recursive: true })
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error
    }
  }

  const skillFilePath = join(skillDir, "SKILL.md")
  const content = skillToSkillMarkdown(skill)

  await writeFile(skillFilePath, content, "utf-8")

  console.log(`[SkillFileManager] Saved skill file: ${skillFilePath}`)
}

/**
 * Delete a skill's SKILL.md file
 */
export async function deleteSkillFile(skillId: string): Promise<void> {
  const skillDir = join(SKILLS_FILE_DIR, skillId)
  const skillFilePath = join(skillDir, "SKILL.md")

  try {
    await unlink(skillFilePath)
    console.log(`[SkillFileManager] Deleted skill file: ${skillFilePath}`)
  } catch (error) {
    // Ignore error if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
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
export async function initializeBuiltinSkills(): Promise<void> {
  await ensureSkillsDirAsync()

  // Save all built-in skills in parallel
  await Promise.all(BUILTIN_SKILLS.map((skill) => saveSkillFile(skill)))

  console.log(`[SkillFileManager] Initialized ${BUILTIN_SKILLS.length} built-in skills`)
}

/**
 * Clear all skill files (useful for reset)
 */
export async function clearAllSkillFiles(): Promise<void> {
  // Clear built-in skills
  const builtinSkillIds = BUILTIN_SKILLS.map((s) => s.id)
  await Promise.all(builtinSkillIds.map((skillId) => deleteSkillFile(skillId)))

  // Also clear user-defined skills from storage
  const userSkills = loadSkills()
  await Promise.all(userSkills.map((skill) => deleteSkillFile(skill.id)))

  console.log("[SkillFileManager] Cleared all skill files (builtin and user)")
}

/**
 * Sync enabled skills to skill files
 * Only saves skills that are enabled
 */
export async function syncEnabledSkills(enabledSkillIds: string[]): Promise<void> {
  await ensureSkillsDirAsync()

  // First, save all built-in skills (they're always available as files)
  const syncPromises = BUILTIN_SKILLS.map(async (skill) => {
    if (enabledSkillIds.includes(skill.id)) {
      await saveSkillFile(skill)
    } else {
      await deleteSkillFile(skill.id)
    }
  })

  await Promise.all(syncPromises)

  console.log(`[SkillFileManager] Synced ${enabledSkillIds.length} enabled skills`)
}
