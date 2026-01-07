"use client"

import { createItem } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ItemFormProps {
  roadmapId: string
  groups: { id: string; name: string }[]
}

export function ItemForm({ roadmapId, groups }: ItemFormProps) {
  return (
    <form action={createItem} className="space-y-6">
      <input type="hidden" name="roadmapId" value={roadmapId} />
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Dark Mode Support" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="A brief overview of the feature..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue="EXPLORING">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPLORING">Exploring</SelectItem>
              <SelectItem value="BUILDING">Building</SelectItem>
              <SelectItem value="TESTING">Testing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidence">Confidence</Label>
          <Select name="confidence" defaultValue="LIKELY">
            <SelectTrigger>
              <SelectValue placeholder="Select confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TENTATIVE">Tentative</SelectItem>
              <SelectItem value="LIKELY">Likely</SelectItem>
              <SelectItem value="CONFIDENT">Confident</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="groupId">Category Group (Optional)</Label>
        <Select name="groupId">
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The &quot;CGS&quot; (Category Grouping System) helps organize your roadmap.
        </p>
      </div>

      <Button type="submit" className="w-full h-12 text-base font-semibold">
        Create Roadmap Item
      </Button>
    </form>
  )
}
