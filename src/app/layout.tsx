import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { RefineContext } from './_refine_context';

export const metadata: Metadata = {
  title: 'NAF',
  description: 'NAF',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Suspense>
          <RefineContext>{children}</RefineContext>
        </Suspense>
      </body>
    </html>
  );
}
