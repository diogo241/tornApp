'use client';

import { useState } from 'react';

import { CircleHelp } from 'lucide-react';

import { InputPassword } from '@/components/refine-ui/form/input-password';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLogin, useRefineOptions } from '@refinedev/core';

export const SignInForm = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { title } = useRefineOptions();

  const { mutate: login, isPending } = useLogin();

  const handleSignIn = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    login({
      email,
      password,
    });
  };
  return (
    <div
      className={cn(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'px-6',
        'py-8',
        'min-h-svh',
      )}
    >
      <div className={cn('flex', 'items-center', 'justify-center')}>
        {title.icon && <div>{title.icon}</div>}
      </div>

      <Card className={cn('sm:w-[456px]', 'p-12', 'mt-6')}>
        <CardHeader className={cn('px-0')}>
          <CardTitle
            className={cn(
              'text-green-600',
              'dark:text-green-400',
              'text-3xl',
              'font-semibold',
            )}
          >
            Sign in
          </CardTitle>
          <CardDescription
            className={cn('text-muted-foreground', 'font-medium')}
          >
            Welcome back
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className={cn('px-0')}>
          <form onSubmit={handleSignIn}>
            <div className={cn('flex', 'flex-col', 'gap-2')}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div
              className={cn('relative', 'flex', 'flex-col', 'gap-2', 'mt-6')}
            >
              <Label htmlFor="password">Password</Label>
              <InputPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div
              className={cn(
                'flex items-center justify-between',
                'flex-wrap',
                'gap-2',
                'mt-4',
              )}
            >
              <div className={cn('flex items-center', 'space-x-2')}>
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked === 'indeterminate' ? false : checked)
                  }
                />
                <Label htmlFor="remember">Remember me</Label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className={cn('w-full', 'mt-6')}
              disabled={isPending}
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

SignInForm.displayName = 'SignInForm';
