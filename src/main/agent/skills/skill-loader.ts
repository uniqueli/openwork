import { v4 as uuidv4 } from "uuid"
import type { Skill, SkillLoadResult } from "../../types"
import { BUILTIN_SKILLS } from "./builtin-skills"
import { loadSkills, saveUserSkills, getEnabledSkillIds, type SkillStorage } from "../../storage"

/**
 * Skill Loader - Manages loading and accessing skills
 */
export class SkillLoader {
  private builtinSkills: Map<string, Skill>
  private userSkills: Map<string, Skill>
  private cache: Map<string, Skill> = new Map()

  constructor() {
    // Load built-in skills
    this.builtinSkills = new Map(BUILTIN_SKILLS.map((s) => [s.id, s]))
    // Load user skills from storage
    this.userSkills = new Map()
    this.loadUserSkillsFromStorage()
  }

  /**
   * Load user skills from storage
   */
  private loadUserSkillsFromStorage(): void {
    const stored = loadSkills()
    for (const skillData of stored) {
      const skill: Skill = {
        id: skillData.id,
        name: skillData.name,
        description: skillData.description,
        category: skillData.category as any,
        prompt: skillData.prompt,
        subSkills: skillData.subSkills,
        enabled: skillData.enabled,
        isBuiltin: skillData.isBuiltin,
        createdAt: new Date(skillData.createdAt),
        updatedAt: new Date(skillData.updatedAt)
      }
      this.userSkills.set(skill.id, skill)
    }
  }

  /**
   * Get all available skills (both built-in and user-defined)
   */
  getAllSkills(): Skill[] {
    return [...this.builtinSkills.values(), ...this.userSkills.values()]
  }

  /**
   * Get built-in skills only
   */
  getBuiltinSkills(): Skill[] {
    return Array.from(this.builtinSkills.values())
  }

  /**
   * Get user-defined skills only
   */
  getUserSkills(): Skill[] {
    return Array.from(this.userSkills.values())
  }

  /**
   * Get a specific skill by ID
   */
  getSkill(id: string): Skill | undefined {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!
    }

    // Check built-in skills
    if (this.builtinSkills.has(id)) {
      const skill = this.builtinSkills.get(id)!
      this.cache.set(id, skill)
      return skill
    }

    // Check user skills
    if (this.userSkills.has(id)) {
      const skill = this.userSkills.get(id)!
      this.cache.set(id, skill)
      return skill
    }

    return undefined
  }

  /**
   * Get enabled skills
   */
  getEnabledSkills(): Skill[] {
    const enabledIds = getEnabledSkillIds()
    return this.getAllSkills().filter((s) => enabledIds.includes(s.id))
  }

  /**
   * Load skills with their full content
   */
  loadSkill(skillId: string): SkillLoadResult {
    const skill = this.getSkill(skillId)

    if (!skill) {
      return {
        skill: {} as Skill,
        loaded: false,
        error: `Skill not found: ${skillId}`
      }
    }

    // Check if skill is enabled
    const enabledIds = getEnabledSkillIds()
    if (!enabledIds.includes(skillId)) {
      return {
        skill,
        loaded: false,
        error: `Skill is not enabled: ${skillId}`
      }
    }

    return {
      skill,
      loaded: true
    }
  }

  /**
   * Load multiple skills
   */
  loadSkills(skillIds: string[]): SkillLoadResult[] {
    return skillIds.map((id) => this.loadSkill(id))
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: string): Skill[] {
    return this.getAllSkills().filter((s) => s.category === category)
  }

  /**
   * Search skills by name or description
   */
  searchSkills(query: string): Skill[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllSkills().filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Check if a skill exists
   */
  hasSkill(id: string): boolean {
    return this.builtinSkills.has(id) || this.userSkills.has(id)
  }

  /**
   * Refresh user skills from storage
   */
  refresh(): void {
    this.cache.clear()
    this.userSkills.clear()
    this.loadUserSkillsFromStorage()
  }
}

// Global skill loader instance
let globalSkillLoader: SkillLoader | null = null

/**
 * Get the global skill loader instance
 */
export function getSkillLoader(): SkillLoader {
  if (!globalSkillLoader) {
    globalSkillLoader = new SkillLoader()
  }
  return globalSkillLoader
}

/**
 * Reset the global skill loader (useful for testing)
 */
export function resetSkillLoader(): void {
  globalSkillLoader = null
}

/**
 * Create a new user skill
 */
export function createUserSkill(
  name: string,
  description: string,
  category: string,
  prompt: string,
  subSkills?: string[]
): Skill {
  return {
    id: `user-${uuidv4()}`,
    name,
    description,
    category: category as any,
    prompt,
    subSkills,
    enabled: false,
    isBuiltin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Save a user skill
 */
export function saveUserSkill(skill: Skill): void {
  const skillData: SkillStorage = {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    prompt: skill.prompt,
    subSkills: skill.subSkills,
    enabled: skill.enabled,
    isBuiltin: skill.isBuiltin,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString()
  }

  // Load existing skills
  const stored = loadSkills()
  const existingIndex = stored.findIndex((s) => s.id === skill.id)

  if (existingIndex >= 0) {
    stored[existingIndex] = skillData
  } else {
    stored.push(skillData)
  }

  saveUserSkills(stored)

  // Refresh the skill loader
  getSkillLoader().refresh()
}

/**
 * Delete a user skill
 */
export function deleteUserSkill(skillId: string): void {
  const stored = loadSkills()
  const filtered = stored.filter((s) => s.id !== skillId)
  saveUserSkills(filtered)

  // Refresh the skill loader
  getSkillLoader().refresh()
}
