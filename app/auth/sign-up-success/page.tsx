'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/app/stores/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  const searchParams = useSearchParams();
  const storedUrl = useAppSelector((state) => state.home.websiteUrl);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
                {storedUrl && (
                  <span className="block mt-2 text-xs text-blue-600">
                    After confirming your email, you'll be redirected to start your audit for {storedUrl}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
