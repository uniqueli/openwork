import { tool } from "@langchain/core/tools"
import { z } from "zod"
import type { Skill } from "../../types"
import { getSkillLoader } from "./skill-loader"
import { getEnabledSkillIds } from "../../storage"

/**
 * Combine multiple skills into a single enhanced prompt
 * This allows the agent to leverage expertise from multiple domains simultaneously
 */
export function combineSkillsPrompts(skills: Skill[]): string {
  if (skills.length === 0) {
    return ""
  }

  if (skills.length === 1) {
    return `# Skill: ${skills[0].name}\n\n${skills[0].prompt}`
  }

  let combined = `# Combined Expertise: ${skills.map((s) => s.name).join(" + ")}\n\n`
  combined += `You are operating with enhanced expertise from multiple domains:\n\n`

  for (const skill of skills) {
    combined += `## ${skill.name}\n`
    combined += `${skill.description}\n\n`
    combined += `### Specialized Knowledge\n`
    combined += `${skill.prompt}\n\n`
    combined += `---\n\n`
  }

  combined += `### Integration Guidelines\n`
  combined += `- Synthesize insights from all domains\n`
  combined += `- Apply interdisciplinary approaches when beneficial\n`
  combined += `- Balance competing priorities from different domains\n`
  combined += `- Leverage the unique strengths of each expertise area\n`

  return combined
}

/**
 * Generate a LangChain tool for loading skills dynamically
 * This tool allows the agent to load specialized skills on-demand
 */
export function createSkillLoadTool() {
  const skillLoader = getSkillLoader()

  return tool(
    async ({ skillName }) => {
      console.log("[Skill Tool] Loading skill:", skillName)

      // If no skill name provided, list available skills
      if (!skillName) {
        const enabledIds = getEnabledSkillIds()
        const enabledSkills = skillLoader.getAllSkills().filter((s) => enabledIds.includes(s.id))

        return `Available skills:\n${formatAvailableSkills(enabledSkills)}`
      }

      // Search for skill by name or ID
      const skill = skillLoader
        .getAllSkills()
        .find((s) => s.id === skillName || s.name.toLowerCase() === skillName.toLowerCase())

      if (!skill) {
        return `Error: Skill "${skillName}" not found. Available skills:\n${formatAvailableSkills(skillLoader.getAllSkills())}`
      }

      // Check if skill is enabled
      const enabledIds = getEnabledSkillIds()
      if (!enabledIds.includes(skill.id)) {
        return `Error: Skill "${skill.name}" is not enabled. Please enable it in settings first.`
      }

      // Return the skill's specialized prompt
      return `# Skill: ${skill.name}

${skill.description}

## Specialized Instructions

${skill.prompt}

---
*Using ${skill.name} skill - incorporate this expertise into your response.*`
    },
    {
      name: "load_skill",
      description: `Load a specialized skill to augment your capabilities.

Available skills can be listed by calling without parameters, or loaded directly by name.

Skills provide specialized expertise in specific domains. When you load a skill, you'll receive specialized instructions and context for that domain.

Use this when:
- The user asks for expertise in a specific domain (SQL, debugging, testing, etc.)
- You need specialized knowledge beyond general assistance
- The user mentions a specific skill by name`,
      schema: z.object({
        skillName: z
          .string()
          .optional()
          .describe("Name or ID of the skill to load. If omitted, lists available skills.")
      })
    }
  )
}

/**
 * Generate a LangChain tool for loading multiple skills at once
 * This allows the agent to combine expertise from multiple domains
 */
export function createMultiSkillLoadTool() {
  const skillLoader = getSkillLoader()

  return tool(
    async ({ skillNames }) => {
      console.log("[Multi-Skill Tool] Loading skills:", skillNames)

      if (!skillNames || skillNames.length === 0) {
        const enabledIds = getEnabledSkillIds()
        const enabledSkills = skillLoader
          .getAllSkills()
          .filter((s) => enabledIds.includes(s.id))

        return `Available skills:\n${formatAvailableSkills(enabledSkills)}\n\nUsage: load_multiple_skills({skillNames: ["sql-expert", "python-expert"]})`
      }

      // Search for skills by name or ID
      const foundSkills: Skill[] = []
      const notFound: string[] = []

      for (const skillName of skillNames) {
        const skill = skillLoader
          .getAllSkills()
          .find(
            (s) =>
              s.id === skillName || s.name.toLowerCase() === skillName.toLowerCase()
          )

        if (skill) {
          // Check if skill is enabled
          const enabledIds = getEnabledSkillIds()
          if (!enabledIds.includes(skill.id)) {
            return `Error: Skill "${skill.name}" is not enabled. Please enable it in settings first.`
          }
          foundSkills.push(skill)
        } else {
          notFound.push(skillName)
        }
      }

      if (notFound.length > 0) {
        return `Error: The following skills were not found: ${notFound.join(", ")}\n\nAvailable skills:\n${formatAvailableSkills(skillLoader.getAllSkills())}`
      }

      // Combine all skills into a single enhanced prompt
      const combinedPrompt = combineSkillsPrompts(foundSkills)

      return combinedPrompt
    },
    {
      name: "load_multiple_skills",
      description: `Load and combine multiple specialized skills simultaneously.

This is useful when a task requires expertise from multiple domains.
For example, combining "sql-expert" and "python-expert" for data analysis tasks.

Use this when:
- A task spans multiple domains
- You need interdisciplinary expertise
- The user requests capabilities from different areas
- Complex problem-solving requires diverse perspectives`,
      schema: z.object({
        skillNames: z
          .array(z.string())
          .describe("Array of skill names or IDs to load and combine")
      })
    }
  )
}

/**
 * Format available skills for display
 */
function formatAvailableSkills(skills: Skill[]): string {
  const byCategory: Record<string, Skill[]> = {}

  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = []
    }
    byCategory[skill.category].push(skill)
  }

  let output = ""
  for (const [category, categorySkills] of Object.entries(byCategory)) {
    output += `\n## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
    for (const skill of categorySkills) {
      output += `- **${skill.name}** (\`${skill.id}\`): ${skill.description}\n`
    }
  }

  return output
}

/**
 * Generate system prompt augmentation for enabled skills
 */
export function generateSkillsSystemPrompt(): string {
  const skillLoader = getSkillLoader()
  const enabledSkills = skillLoader.getEnabledSkills()

  if (enabledSkills.length === 0) {
    return ""
  }

  let prompt = `
# Available Skills

You have access to specialized skills for expert-level assistance. Use these tools to enhance your capabilities:

## Single Skill Loading
Use \`load_skill\` to activate expertise in a specific domain.

## Multi-Skill Combination
Use \`load_multiple_skills\` to combine expertise from multiple domains simultaneously.
Example: load_multiple_skills({skillNames: ["sql-expert", "python-expert"]})

## Enabled Skills:
`

  for (const skill of enabledSkills) {
    prompt += `- **${skill.name}** (\`${skill.id}\`): ${skill.description}\n`
  }

  prompt += `
## When to Use Skills
- User asks for expertise in a specific domain
- Task requires specialized knowledge beyond general assistance
- Complex problems benefit from multiple perspectives
- User mentions a specific skill by name

## Skill Combination Examples
- Data Analysis: "sql-expert" + "python-expert"
- Code Quality: "code-reviewer" + "test-engineer"
- Performance: "performance-optimizer" + "python-expert"
- Security: "security-auditor" + "api-designer"
`

  return prompt
}

/**
 * Get skill IDs that should be auto-loaded for a thread
 */
export function getAutoLoadSkills(): string[] {
  const skillLoader = getSkillLoader()
  return skillLoader.getEnabledSkills().map((s) => s.id)
}

/**
 * Export skill tools for registration with the agent
 */
export function getAllSkillTools() {
  return [
    createSkillLoadTool(),
    createMultiSkillLoadTool()
  ]
}
