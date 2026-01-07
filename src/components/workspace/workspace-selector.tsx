"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Workspace } from "@/types"

interface WorkspaceSelectorProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  onSelect: (workspace: Workspace) => void
  onCreateNew?: () => void
  className?: string
}

export function WorkspaceSelector({
  workspaces,
  currentWorkspace,
  onSelect,
  onCreateNew,
  className,
}: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{currentWorkspace?.name || "Select workspace"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No workspaces found
          </div>
        ) : (
          workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => {
                onSelect(workspace)
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="truncate">
                  <div className="font-medium truncate">{workspace.name}</div>
                  <div className="text-xs text-muted-foreground truncate">/{workspace.slug}</div>
                </div>
              </div>
              {currentWorkspace?.id === workspace.id && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))
        )}
        {onCreateNew && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onCreateNew()
                setOpen(false)
              }}
              className="text-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new workspace
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
