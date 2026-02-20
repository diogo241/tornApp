'use client';

/**
 * Club Funding Export Button Component
 *
 * Purpose: Provides UI for users to export club funding data as PDF
 * Security: Client-side only, relies on server-side authentication
 * UX: Loading state, error handling, success feedback
 * 
 * Usage:
 *   <ClubFundingExportButton />
 *   <ClubFundingExportButton year={2024} />
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ComponentProps } from 'react';

/**
 * Props for the export button component
 */
interface ClubFundingExportButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> {
  /**
   * Optional year filter for the report
   * If not provided, exports all available data
   */
  year?: number;
  
  /**
   * Optional custom label for the button
   * Defaults to "Export PDF" or "Export {year} PDF"
   */
  label?: string;
  
  /**
   * Optional filename override
   * If not provided, uses default naming with timestamp
   */
  filename?: string;
}

/**
 * Club Funding Export Button
 *
 * Features:
 * - Automatic PDF download on click
 * - Loading state during generation
 * - Toast notifications for success/error
 * - Optional year filtering
 * - Disabled state while loading
 * 
 * Security:
 * - Uses fetch with credentials (cookies)
 * - Server handles authentication via getSession()
 * - No sensitive data stored in client state
 * 
 * @param props - Component props
 * @returns Button component with export functionality
 */
export function ClubFundingExportButton({
  year,
  label,
  filename,
  disabled,
  className,
  ...props
}: ClubFundingExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle PDF export
   * 
   * Process:
   * 1. Show loading state
   * 2. Call API endpoint
   * 3. Handle response (success or error)
   * 4. Trigger download or show error
   * 5. Reset loading state
   */
  const handleExport = async () => {
    // Prevent multiple simultaneous exports
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Build URL with optional year parameter
      const queryParams = new URLSearchParams();
      if (year) {
        queryParams.append('year', year.toString());
      }
      const url = `/api/export/club-funding-pdf${queryParams.toString() ? `?${queryParams}` : ''}`;

      // ====================================================================
      // API Call: Fetch PDF from server
      // ====================================================================
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'application/pdf',
        },
      });

      // ====================================================================
      // Error Handling: Check response status
      // ====================================================================
      if (!response.ok) {
        // Parse error response from server
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: 'Failed to generate PDF',
        }));

        // Show error toast
        toast.error(errorData.error || 'Export Failed', {
          description: errorData.message || 'An error occurred while generating the PDF',
        });

        return;
      }

      // ====================================================================
      // Success: Download PDF
      // ====================================================================
      
      // Get blob from response
      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let downloadFilename = filename || `club_funding_report_${Date.now()}.pdf`;
      
      if (contentDisposition) {
        // Parse filename from Content-Disposition header
        // Format: attachment; filename="club_funding_report_2024-02-20_12-30-45.pdf"
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
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
        description: year
          ? `Club funding report for ${year} has been downloaded`
          : 'Club funding report has been downloaded',
      });

    } catch (error) {
      // ====================================================================
      // Network Error: Handle fetch failures
      // ====================================================================
      console.error('PDF export error:', error);
      
      toast.error('Export Failed', {
        description: 'Network error occurred. Please check your connection and try again.',
      });
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  /**
   * Determine button label
   * Uses custom label if provided, otherwise generates default
   */
  const buttonLabel = label || (year ? `Exportar PDF ${year}` : 'Exportar PDF');

  /**
   * Render button with appropriate state
   */
  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        // Show loader when exporting
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          A gerar...
        </>
      ) : (
        // Show download icon and label when ready
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonLabel}
        </>
      )}
    </Button>
  );
}

/**
 * Display name for React DevTools
 */
ClubFundingExportButton.displayName = 'ClubFundingExportButton';

/**
 * Default export
 */
export default ClubFundingExportButton;
