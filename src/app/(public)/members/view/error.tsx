'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PublicMemberErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicMemberError({ reset }: PublicMemberErrorProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex items-center gap-3 border-b pb-4">
          <Image
            src="/logo.png"
            alt="NAF"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <div>
            <p className="text-sm font-semibold leading-none">NAF</p>
            <p className="mt-1 text-xs text-muted-foreground">Área do sócio</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Não foi possível carregar a página</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado ao consultar os dados. Tente novamente
                dentro de momentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={reset}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          Este link é pessoal. Não o partilhe.
        </footer>
      </div>
    </div>
  );
}
