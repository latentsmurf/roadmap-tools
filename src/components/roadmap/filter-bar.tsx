"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FilterBarProps {
    onSearchChange: (value: string) => void
    onStatusFilterChange: (statuses: string[]) => void
    onCategoryFilterChange: (categories: string[]) => void
    selectedStatuses: string[]
    selectedCategories: string[]
    groups: { id: string, name: string }[]
}

export function FilterBar({
    onSearchChange,
    onStatusFilterChange,
    onCategoryFilterChange,
    selectedStatuses,
    selectedCategories,
    groups
}: FilterBarProps) {
    const statuses = ["EXPLORING", "BUILDING", "TESTING", "SHIPPED", "CANCELLED"]

    const toggleStatus = (status: string) => {
        if (selectedStatuses.includes(status)) {
            onStatusFilterChange(selectedStatuses.filter(s => s !== status))
        } else {
            onStatusFilterChange([...selectedStatuses, status])
        }
    }

    const toggleCategory = (id: string) => {
        if (selectedCategories.includes(id)) {
            onCategoryFilterChange(selectedCategories.filter(s => s !== id))
        } else {
            onCategoryFilterChange([...selectedCategories, id])
        }
    }

    return (
        <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search items..."
                    className="pl-9"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statuses.map(status => (
                        <DropdownMenuCheckboxItem
                            key={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={() => toggleStatus(status)}
                        >
                            {status}
                        </DropdownMenuCheckboxItem>
                    ))}

                    {groups.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {groups.map(group => (
                                <DropdownMenuCheckboxItem
                                    key={group.id}
                                    checked={selectedCategories.includes(group.id)}
                                    onCheckedChange={() => toggleCategory(group.id)}
                                >
                                    {group.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
