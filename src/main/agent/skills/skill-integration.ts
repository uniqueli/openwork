import { tool } from "@langchain/core/tools"
import { z } from "zod"
import type { Skill } from "../../types"
import { getSkillLoader } from "./skill-loader"
import { getEnabledSkillIds } from "../../storage"

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
        const enabledSkills = skillLoader
          .getAllSkills()
          .filter((s) => enabledIds.includes(s.id))

        return `Available skills:\n${formatAvailableSkills(enabledSkills)}`
      }

      // Search for skill by name or ID
      const skill = skillLoader.getAllSkills().find(
        (s) => s.id === skillName || s.name.toLowerCase() === skillName.toLowerCase()
      )

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

You have access to the following specialized skills. Use the \`load_skill\` tool to activate them when needed:

`

  for (const skill of enabledSkills) {
    prompt += `- **${skill.name}** (\`${skill.id}\`): ${skill.description}\n`
  }

  prompt += `
To use a skill, call: load_skill({skillName: "${enabledSkills[0].id}"})

This will give you specialized instructions and expertise for that domain.
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
