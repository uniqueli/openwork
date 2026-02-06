/**
 * SuggestionCards - 建议卡片组件
 *
 * 在空聊天状态下显示一组可点击的建议卡片，帮助用户快速开始对话。
 */

import { FolderOpen, PenTool, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * 图标名称到 Lucide 图标组件的映射
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderOpen,
  PenTool,
  FileText
}

/**
 * 单个建议项的数据结构
 */
export interface SuggestionItem {
  icon: string
  title: string
  description: string
}

/**
 * SuggestionCards 组件的 Props
 */
interface SuggestionCardsProps {
  onSelect: (suggestion: SuggestionItem) => void
}

/**
 * 默认建议项列表
 */
const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  {
    icon: "FolderOpen",
    title: "文件整理",
    description: "智能整理和管理本地文件"
  },
  {
    icon: "PenTool",
    title: "内容创作",
    description: "创建演示文稿、文档和多媒体内容"
  },
  {
    icon: "FileText",
    title: "文档处理",
    description: "处理和分析文档数据"
  }
]

/**
 * SuggestionCards 组件 - 建议卡片
 *
 * 渲染一组可点击的建议卡片，使用 CSS grid 水平排列。
 * 每张卡片包含 Lucide 图标、标题和描述，采用垂直布局。
 * 点击卡片时调用 onSelect 回调。
 */
export function SuggestionCards({ onSelect }: SuggestionCardsProps): React.JSX.Element {
  return (
    <div data-testid="suggestion-cards" className="grid grid-cols-3 gap-3 mt-6 w-full max-w-lg">
      {DEFAULT_SUGGESTIONS.map((suggestion) => {
        const IconComponent = ICON_MAP[suggestion.icon]
        return (
          <Card
            key={suggestion.title}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => onSelect(suggestion)}
            data-testid="suggestion-card"
          >
            <CardContent className="p-4 flex flex-col items-start gap-2">
              {IconComponent && (
                <div className="rounded-lg bg-accent/30 p-2">
                  <IconComponent className="size-5 text-muted-foreground" />
                </div>
              )}
              <h3 className="text-sm font-semibold">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
