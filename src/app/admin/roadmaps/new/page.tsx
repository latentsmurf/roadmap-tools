"use client"

import { createRoadmap } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Layers } from "lucide-react"
import Link from "next/link"

export default function NewRoadmapPage() {
    return (
        <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
            <Link href="/admin" className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Control Center
            </Link>

            <div className="w-full max-w-xl">
                <Card className="shadow-2xl border-t-8 border-t-primary overflow-hidden rounded-3xl">
                    <CardHeader className="text-center space-y-4 pt-10">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black">Create Roadmap</CardTitle>
                            <CardDescription className="text-base">
                                Give your product direction a beautiful home.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        <form action={createRoadmap} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Title</label>
                                    <Input
                                        name="title"
                                        placeholder="e.g. Acme OS Roadmap"
                                        required
                                        className="h-14 text-lg rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Slug</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">/r/acme/</span>
                                        <Input
                                            name="slug"
                                            placeholder="q4-features"
                                            required
                                            className="pl-24 h-14 text-lg rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-1">Your roadmap will be accessible at this public URL.</p>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all">
                                Launch Roadmap
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
