import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ItemCardProps {
    title: string
    description?: string
    status: 'EXPLORING' | 'BUILDING' | 'TESTING' | 'SHIPPED'
    confidence?: 'TENTATIVE' | 'LIKELY' | 'CONFIDENT'
    votes: number
    updatedAt?: string
    zoom: 'snapshot' | 'standard' | 'deep'
    hideStatus?: boolean
}

const statusColors: Record<string, string> = {
    EXPLORING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    BUILDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    TESTING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    SHIPPED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
}

export function ItemCard({ title, description, status, confidence, votes, zoom, hideStatus }: ItemCardProps) {
    const isSnapshot = zoom === 'snapshot'

    return (
        <Card className={cn(
            "hover:shadow-md transition-all cursor-pointer border-l-4",
            // Dynamic border color based on status could go here
            "border-l-transparent hover:border-l-primary"
        )}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-medium leading-tight">
                        {title}
                    </CardTitle>
                    <div className="flex gap-2">
                        {!hideStatus && <Badge variant="secondary" className="text-[10px] h-5">{status}</Badge>}
                        {confidence && <Badge variant="outline" className="text-[10px] h-5">{confidence}</Badge>}
                    </div>
                </div>
            </CardHeader>

            {!isSnapshot && description && (
                <CardContent className="p-4 pt-0 pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                </CardContent>
            )}

            <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{votes}</span>
                    </div>
                    {/* Confidence Indicator */}
                    {confidence && !isSnapshot && (
                        <div className="flex items-center gap-1" title={`Confidence: ${confidence}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="capitalize">{confidence.toLowerCase()}</span>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}
