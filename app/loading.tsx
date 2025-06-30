import { Loader2, Globe2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="h-6 w-6" />
            <span className="text-xl font-semibold">Web Audit</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    </div>
  );
} 