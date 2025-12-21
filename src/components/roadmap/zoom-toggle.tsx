"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ZoomLevel } from "@/types"

interface ZoomToggleProps {
    value: ZoomLevel
    onChange: (val: ZoomLevel) => void
}

export function ZoomToggle({ value, onChange }: ZoomToggleProps) {
    return (
        <Tabs value={value} onValueChange={(v) => onChange(v as ZoomLevel)} className="w-auto">
            <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="snapshot" className="text-xs px-2">Snapshot</TabsTrigger>
                <TabsTrigger value="standard" className="text-xs px-2">Standard</TabsTrigger>
                <TabsTrigger value="deep" className="text-xs px-2">Deep</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
