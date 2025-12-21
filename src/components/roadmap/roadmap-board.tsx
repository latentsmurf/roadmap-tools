"use client"

import { ItemCard } from "./item-card"

interface RoadmapBoardProps {
    items: any[]
    onItemClick: (item: any) => void
}

const STATUS_COLUMNS = [
    { id: "EXPLORING", label: "Exploring", color: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300" },
    { id: "BUILDING", label: "Building", color: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300" },
    { id: "TESTING", label: "Testing", color: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300" },
    { id: "SHIPPED", label: "Shipped", color: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300" },
]

export function RoadmapBoard({ items, onItemClick }: RoadmapBoardProps) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
            {STATUS_COLUMNS.map(col => {
                const colItems = items.filter(i => i.status === col.id)

                return (
                    <div key={col.id} className="min-w-[280px] w-[320px] flex-shrink-0 flex flex-col gap-4">
                        <div className={`p-3 rounded-lg border ${col.color} font-medium flex justify-between items-center`}>
                            <span>{col.label}</span>
                            <span className="text-xs opacity-70 bg-background/50 px-2 py-0.5 rounded-full">
                                {colItems.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {colItems.length === 0 && (
                                <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground opacity-50">
                                    Empty
                                </div>
                            )}
                            {colItems.map(item => (
                                <div key={item.id} onClick={() => onItemClick(item)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                                    <ItemCard
                                        {...item}
                                        zoom="standard"
                                        hideStatus // Don't show status badge on card in board view as column implies it
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
