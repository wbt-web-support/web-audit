import { Card } from "@/components/ui/card";

export default function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Completing Authentication
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we complete your sign-in...
        </p>
      </Card>
    </div>
  );
}
