import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { RefineContext } from './_refine_context';

export const metadata: Metadata = {
  title: 'NAF',
  description: 'Aplicação de gestão de torneios, clubes e arbitragem.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="dark">
      <body>
        <Suspense>
          <RefineContext>{children}</RefineContext>
        </Suspense>
      </body>
    </html>
  );
}
