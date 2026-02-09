import { useState, useEffect } from "react"
import type { SkillCategory } from "../../types"
import { SKILL_TEMPLATES, renderTemplate } from "./skill-templates"

interface CreateSkillDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (skill: { name: string; description: string; category: string; prompt: string }) => void
}

const categories: { value: SkillCategory; label: string; description: string }[] = [
  { value: "coding", label: "Coding", description: "Programming and development tasks" },
  { value: "analysis", label: "Analysis", description: "Data analysis and research" },
  { value: "creative", label: "Creative", description: "Writing and creative work" },
  { value: "data", label: "Data", description: "Database and data management" },
  { value: "system", label: "System", description: "System operations and debugging" },
  { value: "custom", label: "Custom", description: "Other specialized skills" }
]

export function CreateSkillDialog({ open, onClose, onCreate }: CreateSkillDialogProps) {
  const [mode, setMode] = useState<"custom" | "template">("custom")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({})

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<SkillCategory>("custom")
  const [prompt, setPrompt] = useState("")

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setMode("custom")
      setSelectedTemplate(null)
      setTemplateValues({})
      setName("")
      setDescription("")
      setCategory("custom")
      setPrompt("")
    }
  }, [open])

  // Update form when template is selected
  useEffect(() => {
    if (mode === "template" && selectedTemplate) {
      const template = SKILL_TEMPLATES.find((t) => t.id === selectedTemplate)
      if (template) {
        setCategory(template.category)
        // Pre-fill with template name and description
        setName(template.name.replace(/{{.*?}}/g, "Custom"))
        setDescription(template.description)
        setPrompt(template.prompt)
      }
    }
  }, [selectedTemplate, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalPrompt =
      mode === "template" && selectedTemplate
        ? renderTemplate(SKILL_TEMPLATES.find((t) => t.id === selectedTemplate)!, templateValues)
        : prompt

    if (!name.trim() || !description.trim() || !finalPrompt.trim()) {
      return
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      category,
      prompt: finalPrompt.trim()
    })

    // Reset form
    setMode("custom")
    setSelectedTemplate(null)
    setTemplateValues({})
    setName("")
    setDescription("")
    setCategory("custom")
    setPrompt("")
    onClose()
  }

  const currentTemplate = SKILL_TEMPLATES.find((t) => t.id === selectedTemplate)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-[#1A1A1D] rounded-lg shadow-xl border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Create Custom Skill</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "custom"
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Custom
          </button>
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "template"
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            From Template
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {mode === "template" && (
            /* Template Selection */
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose Template
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {SKILL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`px-3 py-2 text-left text-sm rounded-md transition-colors ${
                      selectedTemplate === template.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs opacity-75">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template Variables */}
          {mode === "template" &&
            currentTemplate &&
            currentTemplate.variables &&
            currentTemplate.variables.length > 0 && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-sm font-medium text-white">Customize Template</h4>
                {currentTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm text-gray-300 mb-1">
                      {variable.label}
                      {variable.required && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={templateValues[variable.name] || ""}
                      onChange={(e) =>
                        setTemplateValues({ ...templateValues, [variable.name]: e.target.value })
                      }
                      placeholder={variable.placeholder}
                      className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
                      required={variable.required}
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., React Expert, Python Specialist"
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this skill does"
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    category === cat.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs opacity-75">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Specialized Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the specialized instructions and expertise for this skill..."
              rows={8}
              className="w-full px-3 py-2 text-sm text-white placeholder-gray-500 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-blue-500 resize-none"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              This prompt will be loaded when the agent activates this skill, providing specialized
              knowledge and instructions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !description.trim() || !prompt.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Create Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
