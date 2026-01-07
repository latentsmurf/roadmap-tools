import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-destructive rounded-3xl">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription className="text-base">
              You don&apos;t have permission to access this page. Contact an administrator if you
              believe this is an error.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10 space-y-4">
          <Button asChild variant="default" className="w-full rounded-xl">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href="/login" className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
