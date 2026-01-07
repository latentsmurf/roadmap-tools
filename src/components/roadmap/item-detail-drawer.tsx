"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUp, Clock } from "lucide-react"
import { toggleVote, subscribeToItem } from "@/lib/actions"
import { useState } from "react"
import { Input } from "@/components/ui/input"

interface ItemDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    title: string
    description?: string
    status: string
    confidence: string
    votes: number
  } | null
}

export function ItemDetailDrawer({ isOpen, onClose, item }: ItemDetailDrawerProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState("")

  if (!item) return null

  const handleVote = async () => {
    setIsVoting(true)
    await toggleVote(item.id)
    setIsVoting(false)
    // Ideally optimistically update vote count here or revalidate happens automatically
  }

  const handleSubscribe = async () => {
    if (!email) return
    await subscribeToItem(item.id, email)
    setShowEmail(false)
    setEmail("")
    alert("Subscribed!")
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="outline">{item.status}</Badge>
            <Badge variant="secondary">{item.confidence}</Badge>
          </div>
          <SheetTitle className="text-2xl">{item.title}</SheetTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4" />
              <span>{item.votes} votes</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Last updated just now</span>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="prose prose-sm dark:prose-invert">
            <p>{item.description || "No description provided."}</p>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Feedback</h4>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button onClick={handleVote} disabled={isVoting} className="w-full gap-2">
                  <ArrowUp className="w-4 h-4" />
                  {isVoting ? "Voting..." : "Upvote"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowEmail(!showEmail)}
                >
                  Follow Updates
                </Button>
              </div>

              {showEmail && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button onClick={handleSubscribe}>Submit</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
