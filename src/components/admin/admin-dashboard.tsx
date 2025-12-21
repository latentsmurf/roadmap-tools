"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Plus, ExternalLink, Settings } from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"

export function AdminDashboard({ roadmaps, userEmail }: { roadmaps: any[], userEmail?: string | null }) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredRoadmaps = roadmaps.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">Control Center</h1>
                    <p className="text-muted-foreground font-medium">
                        Welcome back, <span className="text-primary">{userEmail}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => signOut()} className="rounded-full px-6">
                        Logout
                    </Button>
                    <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
                        <Link href="/admin/roadmaps/new" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Roadmap
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search your roadmaps..."
                    className="pl-11 h-12 text-lg rounded-2xl bg-card border-border/50 shadow-sm transition-all focus:shadow-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRoadmaps.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                        <p className="text-muted-foreground">No roadmaps found. Create your first one to get started!</p>
                    </div>
                )}
                {filteredRoadmaps.map((roadmap) => (
                    <Card key={roadmap.id} className="group overflow-hidden rounded-3xl border border-border/40 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold text-xs">
                                    {roadmap.slug}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                                        <Link href={`/admin/roadmaps/${roadmap.id}/settings`}>
                                            <Settings className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                                        <Link href={`/r/${roadmap.workspaceId || 'default'}/${roadmap.slug}`} target="_blank">
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-xl font-bold">{roadmap.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                                {roadmap.description || "Active product roadmap with public access."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="text-sm">
                                    <span className="font-bold text-lg">{roadmap.itemCount || 0}</span>
                                    <span className="text-muted-foreground ml-1">Items</span>
                                </div>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-1/2" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1 rounded-xl font-semibold" asChild>
                                    <Link href={`/admin/items/new?roadmapId=${roadmap.id}`}>
                                        + Item
                                    </Link>
                                </Button>
                                <Button variant="outline" className="flex-1 rounded-xl font-semibold" onClick={() => {
                                    const name = prompt("Enter new category name:")
                                    if (name) {
                                        import("@/lib/actions-groups").then(m => m.createGroup(roadmap.id, name))
                                    }
                                }}>
                                    + Group
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
