import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Box, Layers, ShieldCheck, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
      <header className="px-6 lg:px-10 h-20 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground transform group-hover:rotate-6 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Roadmap<span className="text-primary">.tools</span></span>
        </Link>
        <nav className="hidden md:flex gap-8">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">Features</Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/embed-demo">Demo</Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="https://docs.roadmap.tools">Docs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
            <Link href="/admin">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden border-b">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] -z-10" />
          <div className="container px-4 md:px-6 mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase animate-pulse">
              <Zap className="w-3 h-3" />
              Embed-First Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl mx-auto leading-[1.1]">
              Share your direction. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Build radical trust.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
              The premium roadmap platform for SaaS. Beautiful embeds, multi-level views, and zero-config feedback loops. Stop keeping users in the dark.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full group" asChild>
                <Link href="/admin">
                  Create Your Roadmap
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full" asChild>
                <Link href="/embed-demo">Watch Demo</Link>
              </Button>
            </div>
            <div className="pt-12 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl opacity-20" />
              <div className="relative bg-card border rounded-2xl shadow-2xl p-2 max-w-5xl mx-auto overflow-hidden">
                <img
                  src="/hero-preview.png"
                  alt="Roadmap Dashboard Preview"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Zoomable Roadmap</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From high-level snapshots to deep-dive technical specs. Let users choose the level of detail they need.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">1ms Embeds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our lightweight Web Component loads instantly in any framework. Brand it with CSS variables to make it yours.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Trust Signals</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Explicit confidence levels and status updates manage user expectations and reduce support tickets.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6 lg:px-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-bold">Roadmap.tools</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Antigravity. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="text-sm hover:underline" href="#">Privacy</Link>
            <Link className="text-sm hover:underline" href="#">Terms</Link>
            <Link className="text-sm hover:underline" href="#">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
