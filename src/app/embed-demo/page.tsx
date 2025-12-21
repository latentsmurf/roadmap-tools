"use client"

import { useEffect } from "react"

export default function EmbedDemoPage() {
    useEffect(() => {
        const script = document.createElement("script")
        script.src = "/embed.js"
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    return (
        <div className="min-h-screen bg-neutral-50 p-10 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-4xl font-black text-neutral-900 mb-2">My Awesome SaaS</h1>
                    <p className="text-lg text-neutral-600">This is a marketing page hosting the roadmap embed.</p>
                </header>

                <hr className="border-neutral-200" />

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">What's Coming Next?</h2>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-100 min-h-[400px]">
                        {/* The Web Component will live here */}
                        {/* @ts-ignore */}
                        <roadmap-portal workspace="acme" slug="firebase-demo" zoom="snapshot"></roadmap-portal>
                    </div>
                </section>
            </div>
        </div>
    )
}
