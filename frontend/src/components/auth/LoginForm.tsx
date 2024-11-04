'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Add your login logic here
      // Example: await signIn('credentials', { ...data, redirect: false })
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-sm text-muted-foreground">
            New to MoocFlix?{' '}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
