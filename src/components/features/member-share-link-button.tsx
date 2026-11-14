'use client';

import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@lib/utils';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';

export type MemberShareLinkButtonProps = {
  viewToken?: string;
  memberName: string;
  variant?: 'icon' | 'button';
};

export function MemberShareLinkButton({
  viewToken,
  memberName,
  variant = 'icon',
}: MemberShareLinkButtonProps) {
  const handleCopy = async () => {
    if (!viewToken) {
      toast.error('Não foi possível gerar o link de partilha.');
      return;
    }

    const shareUrl = `${window.location.origin}/members/view?token=${encodeURIComponent(viewToken)}`;
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      toast.success('Link copiado');
    } else {
      toast.error('Não foi possível copiar o link.');
    }
  };

  if (variant === 'button') {
    return (
      <Button type="button" variant="outline" onClick={handleCopy}>
        <Link2 className="h-4 w-4" aria-hidden="true" />
        Partilhar
      </Button>
    );
  }

  const label = `Copiar link de ${memberName}`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={handleCopy}
    >
      <Link2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
