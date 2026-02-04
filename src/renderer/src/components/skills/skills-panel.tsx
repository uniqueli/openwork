import { useState, useEffect } from "react"
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"
import { CreateSkillDialog } from "./create-skill-dialog"
import { SkillDetailDialog } from "./skill-detail-dialog"
import type { Skill } from "../../types"

interface SkillsPanelProps {
  onClose?: () => void
}

export function SkillsPanel(_props: SkillsPanelProps) {
  const [skills, setSkills] = useState<Array<Skill & { enabled: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "enabled" | "builtin" | "user">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<(Skill & { enabled: boolean }) | null>(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    setLoading(true)
    try {
      const result = await window.api.skills.list()
      if (result.success && result.skills) {
        setSkills(result.skills)
      }
    } catch (error) {
      console.error("Failed to load skills:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = async (skillId: string, enabled: boolean) => {
    const result = await window.api.skills.toggle(skillId, enabled)
    if (result.success) {
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, enabled: result.enabled ?? false } : s))
      )
    }
  }

  const handleCreateSkill = async (skill: {
    name: string
    description: string
    category: string
    prompt: string
  }) => {
    const result = await window.api.skills.create(skill)
    if (result.success) {
      loadSkills()
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    const result = await window.api.skills.delete(skillId)
    if (result.success) {
      loadSkills()
    }
  }

  const filteredSkills = skills.filter((skill) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !skill.name.toLowerCase().includes(query) &&
        !skill.description.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    if (filter === "enabled") return skill.enabled
    if (filter === "builtin") return skill.isBuiltin
    if (filter === "user") return !skill.isBuiltin
    return true
  })

  const groupedSkills = filteredSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, Array<Skill & { enabled: boolean }>>
  )

  const categoryColors: Record<string, string> = {
    coding: "bg-blue-500/10 text-blue-500",
    analysis: "bg-purple-500/10 text-purple-500",
    creative: "bg-pink-500/10 text-pink-500",
    data: "bg-green-500/10 text-green-500",
    system: "bg-orange-500/10 text-orange-500",
    custom: "bg-cyan-500/10 text-cyan-500"
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#0D0D0F]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Skills</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              + New Skill
            </button>
            <span className="text-sm text-gray-400">
              {skills.filter((s) => s.enabled).length} / {skills.length} enabled
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-white/5">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-white/20"
          />
          <div className="flex gap-2">
            {(["all", "enabled", "builtin", "user"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === f
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Skills List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-gray-400">Loading skills...</div>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No skills found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSkills).map(([category, categorySkills]) => {
                  const skillsList = categorySkills as Array<Skill & { enabled: boolean }>
                  return (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-300 mb-2 capitalize">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {skillsList.map((skill) => (
                          <div
                            key={skill.id}
                            onClick={() => setSelectedSkill(skill)}
                            className="flex items-start justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-white">{skill.name}</h4>
                                <Badge
                                  className={categoryColors[skill.category] || categoryColors.custom}
                                >
                                  {skill.category}
                                </Badge>
                                {skill.isBuiltin && (
                                  <Badge className="bg-white/5 text-gray-400 text-xs">
                                    Built-in
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2">{skill.description}</p>
                            </div>
                            <Switch
                              checked={skill.enabled}
                              onCheckedChange={(checked) => {
                                toggleSkill(skill.id, checked)
                                // Stop propagation to prevent opening detail dialog
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="ml-3 flex-shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Skill Dialog */}
      <CreateSkillDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateSkill}
      />

      {/* Skill Detail Dialog */}
      {selectedSkill && (
        <SkillDetailDialog
          skill={selectedSkill}
          open={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onToggle={toggleSkill}
          onDelete={handleDeleteSkill}
        />
      )}
    </>
  )
}
