import { v4 as uuidv4 } from "uuid"
import type { Skill, SkillLoadResult } from "../../types"
import { BUILTIN_SKILLS } from "./builtin-skills"
import { loadSkills, saveUserSkills, getEnabledSkillIds, type SkillStorage } from "../../storage"

/**
 * LRU Cache entry with timestamp
 */
interface CacheEntry {
  skill: Skill
  lastAccessed: number
}

/**
 * Skill Loader - Manages loading and accessing skills
 * Implements LRU caching with size limits to prevent memory issues
 */
export class SkillLoader {
  private builtinSkills: Map<string, Skill>
  private userSkills: Map<string, Skill>
  private cache: Map<string, CacheEntry> = new Map()
  private readonly MAX_CACHE_SIZE = 100 // Maximum number of cached skills
  private cacheHits = 0
  private cacheMisses = 0

  constructor() {
    // Load built-in skills
    this.builtinSkills = new Map(
      BUILTIN_SKILLS.map((s) => [
        s.id,
        // Ensure version field exists (default to "1.0.0" for compatibility)
        { ...s, version: s.version || "1.0.0" }
      ])
    )
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
        category: skillData.category as Skill["category"],
        prompt: skillData.prompt,
        subSkills: skillData.subSkills,
        enabled: skillData.enabled,
        isBuiltin: skillData.isBuiltin,
        version: skillData.version || "1.0.0", // Default version for compatibility
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
    // Check cache first (LRU)
    const cachedEntry = this.cache.get(id)
    if (cachedEntry) {
      this.cacheHits++
      // Update last accessed time
      cachedEntry.lastAccessed = Date.now()
      return cachedEntry.skill
    }

    this.cacheMisses++

    // Check built-in skills
    if (this.builtinSkills.has(id)) {
      const skill = this.builtinSkills.get(id)!
      this.addToCache(id, skill)
      return skill
    }

    // Check user skills
    if (this.userSkills.has(id)) {
      const skill = this.userSkills.get(id)!
      this.addToCache(id, skill)
      return skill
    }

    return undefined
  }

  /**
   * Add skill to cache with LRU eviction
   */
  private addToCache(id: string, skill: Skill): void {
    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(id)) {
      let lruId: string | null = null
      let lruTime = Infinity

      for (const [cacheId, entry] of this.cache.entries()) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed
          lruId = cacheId
        }
      }

      if (lruId) {
        this.cache.delete(lruId)
        console.log(`[SkillLoader] Evicted LRU skill from cache: ${lruId}`)
      }
    }

    // Add to cache
    this.cache.set(id, {
      skill,
      lastAccessed: Date.now()
    })
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
    console.log("[SkillLoader] Cache cleared")
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    maxSize: number
    hits: number
    misses: number
    hitRate: number
  } {
    const total = this.cacheHits + this.cacheMisses
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100
    }
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
    this.clearCache()
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
  subSkills?: string[],
  version?: string
): Skill {
  return {
    id: `user-${uuidv4()}`,
    name,
    description,
    category: category as Skill["category"],
    prompt,
    subSkills,
    enabled: false,
    isBuiltin: false,
    version: version || "1.0.0", // Default to version 1.0.0
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
    version: skill.version, // Include version in storage
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
