"use client"

import { Button } from "@/components/ui/button"
import type { ViewType } from "@/types"

interface ViewTypeSelectorProps {
  value: ViewType
  onChange: (type: ViewType) => void
}

const viewTypes: { value: ViewType; label: string }[] = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "timeline", label: "Timeline" },
  { value: "changelog", label: "Changelog" },
]

export function ViewTypeSelector({ value, onChange }: ViewTypeSelectorProps) {
  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-1 overflow-x-auto">
      {viewTypes.map((type) => (
        <Button
          key={type.value}
          variant={value === type.value ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange(type.value)}
        >
          {type.label}
        </Button>
      ))}
    </div>
  )
}
