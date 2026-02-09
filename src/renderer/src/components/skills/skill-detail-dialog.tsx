import type { Skill } from "../../types"

interface SkillDetailDialogProps {
  skill: Skill & { enabled: boolean }
  open: boolean
  onClose: () => void
  onToggle?: (skillId: string, enabled: boolean) => void
  onDelete?: (skillId: string) => void
}

const categoryColors: Record<string, string> = {
  coding: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  analysis: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  creative: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  data: "bg-green-500/10 text-green-500 border-green-500/20",
  system: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  custom: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
}

export function SkillDetailDialog({
  skill,
  open,
  onClose,
  onToggle,
  onDelete
}: SkillDetailDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl mx-4 max-h-[80vh] bg-[#1A1A1D] rounded-lg shadow-xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-white">{skill.name}</h2>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${categoryColors[skill.category] || categoryColors.custom}`}
              >
                {skill.category}
              </span>
              {skill.isBuiltin && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/5 text-gray-400 border border-white/10">
                  Built-in
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{skill.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-sm font-medium text-white">
                {skill.enabled ? (
                  <span className="text-green-400">Enabled</span>
                ) : (
                  <span className="text-gray-400">Disabled</span>
                )}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="text-xs text-gray-500 mb-1">Type</div>
              <div className="text-sm font-medium text-white">
                {skill.isBuiltin ? "Built-in Skill" : "Custom Skill"}
              </div>
            </div>
          </div>

          {/* Specialized Prompt */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Specialized Prompt</h3>
            <div className="bg-white/5 rounded-lg p-4 border border-white/5">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {skill.prompt}
              </pre>
            </div>
          </div>

          {/* Sub Skills */}
          {skill.subSkills && skill.subSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Sub Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skill.subSkills.map((subSkill) => (
                  <span
                    key={subSkill}
                    className="px-3 py-1 text-sm bg-white/5 text-gray-300 rounded-md border border-white/10"
                  >
                    {subSkill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <div className="text-xs text-gray-500">
            Created: {new Date(skill.createdAt).toLocaleDateString()} • Updated:{" "}
            {new Date(skill.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3">
            {!skill.isBuiltin && onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${skill.name}"?`)) {
                    onDelete(skill.id)
                    onClose()
                  }
                }}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
            {onToggle && (
              <button
                onClick={() => onToggle(skill.id, !skill.enabled)}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  skill.enabled
                    ? "bg-white/10 text-gray-300 hover:bg-white/15"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {skill.enabled ? "Disable" : "Enable"}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/15 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
