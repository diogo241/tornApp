'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ClubFundingExportButton() {
  const [isLoading, setIsLoading] = useState(false);

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
      let downloadFilename = `club_funding_report_${Date.now()}.pdf`;

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
      toast.success('PDF Exported Successfully', {
        richColors: true,
      });
    } catch (error) {
      toast.error('Export Failed', {
        description:
          'Network error occurred. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render button with appropriate state
   */
  return (
    <Button onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Municipal Resume
        </>
      )}
    </Button>
  );
}

export default ClubFundingExportButton;
