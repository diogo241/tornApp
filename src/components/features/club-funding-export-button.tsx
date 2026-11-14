'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useList, type HttpError } from '@refinedev/core';
import type { Tournament } from '@lib/types';

export function ClubFundingExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  // Only show button if there are any tournaments
  const { result, query } = useList<Tournament, HttpError>({
    resource: 'tournaments',
  });
  const tournaments = result?.data ?? [];
  if (query.isLoading) return null;

  const handleExport = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const url = '/api/export/club-funding-pdf';

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/pdf',
        },
      });

      // ====================================================================
      // Success: Download PDF
      // ====================================================================

      // Get blob from response
      const blob = await response.blob();

      const contentDisposition = response.headers.get('Content-Disposition');
      let downloadFilename = `relatorio-financiamento-municipal_${Date.now()}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Show success toast
      toast.success('PDF exportado com sucesso', {
        richColors: true,
      });
    } catch (error) {
      toast.error('Falha na exportação', {
        description:
          'Ocorreu um erro de rede. Verifique a ligação e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render button with appropriate state
   */
  return (
    <>
      {tournaments.length > 0 && (
        <Button onClick={handleExport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A gerar...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar resumo municipal
            </>
          )}
        </Button>
      )}
    </>
  );
}

export default ClubFundingExportButton;
