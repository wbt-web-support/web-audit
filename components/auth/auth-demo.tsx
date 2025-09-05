"use client";

import { useState } from 'react';
import { useAuthWithBackend } from '@/lib/hooks/useAuthWithBackend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';

export function AuthDemo() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated, signIn, signUp, signOut, userTier, rateLimitInfo } = useAuthWithBackend();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, {
          name: formData.name,
          company: formData.company
        });
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (result.error) {
        toast.error(`Error: ${result.error.message}`);
      } else {
        if (isSignUp) {
          toast.success('Success! Check your email for verification link.');
        } else {
          toast.success('Successfully signed in!');
        }
      }
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.success('Successfully signed out!');
      }
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>You are successfully authenticated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          
          {userTier && (
            <div>
              <Label className="text-sm font-medium">User Tier</Label>
              <p className="text-sm text-muted-foreground">{userTier}</p>
            </div>
          )}
          
          {rateLimitInfo && (
            <div>
              <Label className="text-sm font-medium">Rate Limit Info</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Remaining: {rateLimitInfo.remaining}</p>
                <p>Burst Remaining: {rateLimitInfo.burstRemaining}</p>
              </div>
            </div>
          )}
          
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
