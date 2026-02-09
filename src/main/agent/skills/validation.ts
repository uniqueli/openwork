/**
 * Validation utilities for user-defined skills
 * Prevents security issues and resource exhaustion
 */

import type { Skill } from "../../types"

export interface ValidationResult {
  valid: boolean
  error?: string
  field?: string
}

/**
 * Maximum lengths for skill fields
 */
export const SKILL_LIMITS = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  PROMPT_MAX_LENGTH: 50000, // 50k characters ~ 15-20k tokens
  CATEGORY_MAX_LENGTH: 50,
  SUBSKILLS_MAX_COUNT: 20
} as const

/**
 * Minimum lengths for skill fields
 */
export const SKILL_MIN_LENGTHS = {
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MIN_LENGTH: 10,
  PROMPT_MIN_LENGTH: 50
} as const

/**
 * Valid skill categories
 */
export const VALID_CATEGORIES = [
  "coding",
  "analysis",
  "creative",
  "data",
  "system",
  "custom"
] as const

/**
 * Validate skill name
 */
export function validateSkillName(name: string): ValidationResult {
  if (!name || typeof name !== "string") {
    return {
      valid: false,
      error: "Name is required",
      field: "name"
    }
  }

  const trimmed = name.trim()

  if (trimmed.length < SKILL_MIN_LENGTHS.NAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Name must be at least ${SKILL_MIN_LENGTHS.NAME_MIN_LENGTH} characters`,
      field: "name"
    }
  }

  if (trimmed.length > SKILL_LIMITS.NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Name must not exceed ${SKILL_LIMITS.NAME_MAX_LENGTH} characters`,
      field: "name"
    }
  }

  // Check for suspicious patterns (potential injection attempts)
  if (/[<>{}\\]/.test(trimmed)) {
    return {
      valid: false,
      error: "Name contains invalid characters",
      field: "name"
    }
  }

  return { valid: true }
}

/**
 * Validate skill description
 */
export function validateSkillDescription(description: string): ValidationResult {
  if (!description || typeof description !== "string") {
    return {
      valid: false,
      error: "Description is required",
      field: "description"
    }
  }

  const trimmed = description.trim()

  if (trimmed.length < SKILL_MIN_LENGTHS.DESCRIPTION_MIN_LENGTH) {
    return {
      valid: false,
      error: `Description must be at least ${SKILL_MIN_LENGTHS.DESCRIPTION_MIN_LENGTH} characters`,
      field: "description"
    }
  }

  if (trimmed.length > SKILL_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Description must not exceed ${SKILL_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
      field: "description"
    }
  }

  return { valid: true }
}

/**
 * Validate skill prompt
 */
export function validateSkillPrompt(prompt: string): ValidationResult {
  if (!prompt || typeof prompt !== "string") {
    return {
      valid: false,
      error: "Prompt is required",
      field: "prompt"
    }
  }

  const trimmed = prompt.trim()

  if (trimmed.length < SKILL_MIN_LENGTHS.PROMPT_MIN_LENGTH) {
    return {
      valid: false,
      error: `Prompt must be at least ${SKILL_MIN_LENGTHS.PROMPT_MIN_LENGTH} characters`,
      field: "prompt"
    }
  }

  if (trimmed.length > SKILL_LIMITS.PROMPT_MAX_LENGTH) {
    return {
      valid: false,
      error: `Prompt must not exceed ${SKILL_LIMITS.PROMPT_MAX_LENGTH} characters (currently ${trimmed.length})`,
      field: "prompt"
    }
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
    /<iframe[^>]*>/gi, // Iframes
    /<embed[^>]*>/gi, // Embed tags
    /<object[^>]*>/gi // Object tags
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: "Prompt contains potentially dangerous content",
        field: "prompt"
      }
    }
  }

  // Check for excessive repetition (potential DoS)
  const repeatedChars = /(.)\1{100,}/g
  if (repeatedChars.test(trimmed)) {
    return {
      valid: false,
      error: "Prompt contains excessive repetition",
      field: "prompt"
    }
  }

  return { valid: true }
}

/**
 * Validate skill category
 */
export function validateSkillCategory(category: string): ValidationResult {
  if (!category || typeof category !== "string") {
    return {
      valid: false,
      error: "Category is required",
      field: "category"
    }
  }

  const trimmed = category.trim().toLowerCase()

  if (trimmed.length > SKILL_LIMITS.CATEGORY_MAX_LENGTH) {
    return {
      valid: false,
      error: `Category must not exceed ${SKILL_LIMITS.CATEGORY_MAX_LENGTH} characters`,
      field: "category"
    }
  }

  if (!VALID_CATEGORIES.includes(trimmed as Skill["category"])) {
    return {
      valid: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      field: "category"
    }
  }

  return { valid: true }
}

/**
 * Validate subSkills array
 */
export function validateSubSkills(subSkills?: string[]): ValidationResult {
  if (!subSkills || subSkills.length === 0) {
    return { valid: true }
  }

  if (!Array.isArray(subSkills)) {
    return {
      valid: false,
      error: "Sub-skills must be an array",
      field: "subSkills"
    }
  }

  if (subSkills.length > SKILL_LIMITS.SUBSKILLS_MAX_COUNT) {
    return {
      valid: false,
      error: `Cannot have more than ${SKILL_LIMITS.SUBSKILLS_MAX_COUNT} sub-skills`,
      field: "subSkills"
    }
  }

  for (let i = 0; i < subSkills.length; i++) {
    const subSkill = subSkills[i]
    if (typeof subSkill !== "string" || subSkill.trim().length === 0) {
      return {
        valid: false,
        error: `Sub-skill at index ${i} must be a non-empty string`,
        field: "subSkills"
      }
    }
  }

  return { valid: true }
}

/**
 * Validate complete skill data
 */
export function validateSkillData(data: {
  name: string
  description: string
  category: string
  prompt: string
  subSkills?: string[]
}): ValidationResult {
  // Validate name
  const nameResult = validateSkillName(data.name)
  if (!nameResult.valid) {
    return nameResult
  }

  // Validate description
  const descriptionResult = validateSkillDescription(data.description)
  if (!descriptionResult.valid) {
    return descriptionResult
  }

  // Validate category
  const categoryResult = validateSkillCategory(data.category)
  if (!categoryResult.valid) {
    return categoryResult
  }

  // Validate prompt
  const promptResult = validateSkillPrompt(data.prompt)
  if (!promptResult.valid) {
    return promptResult
  }

  // Validate subSkills
  const subSkillsResult = validateSubSkills(data.subSkills)
  if (!subSkillsResult.valid) {
    return subSkillsResult
  }

  return { valid: true }
}

/**
 * Sanitize user input by removing potentially harmful content
 */
export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "")

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim()

  return sanitized
}
