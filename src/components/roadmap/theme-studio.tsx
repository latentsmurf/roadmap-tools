"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Paintbrush } from "lucide-react"
import { useState } from "react"

const STYLE_PACKS = [
  {
    name: "Default",
    tokens: { "--rm-primary": "222.2 47.4% 11.2%", "--rm-bg": "0 0% 100%" },
  },
  {
    name: "Neon Night",
    tokens: { "--rm-primary": "262 80% 50%", "--rm-bg": "222 47% 11%" },
  },
  {
    name: "Ocean",
    tokens: { "--rm-primary": "199 89% 48%", "--rm-bg": "210 40% 96%" },
  },
]

export function ThemeStudio() {
  const [isOpen, setIsOpen] = useState(false)

  const applyTheme = (tokens: Record<string, string>) => {
    const root = document.documentElement
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        >
          <Paintbrush className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Theme Studio</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Style Packs</h4>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PACKS.map((pack) => (
                <Button
                  key={pack.name}
                  variant="outline"
                  className="justify-start"
                  onClick={() => applyTheme(pack.tokens)}
                >
                  {pack.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Custom Colors</h4>
            <div className="grid gap-2">
              <Label htmlFor="primary-color">Primary (HSL)</Label>
              <Input
                id="primary-color"
                placeholder="e.g. 222.2 47.4% 11.2%"
                onChange={(e) => {
                  document.documentElement.style.setProperty("--rm-primary", e.target.value)
                }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
