'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Firestore Error Monitoring System.
 * In a real production app, this would integrate with Sentry, LogRocket, or Datadog.
 */
export function FirestoreMonitor() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      let errorData = error;
      
      // Try to parse JSON from error message if it's the standard format
      try {
        if (error.message && (error.message.startsWith('{') || error.message.includes('{"error"'))) {
          const startIdx = error.message.indexOf('{');
          errorData = JSON.parse(error.message.substring(startIdx));
        }
      } catch (e) {
        console.warn('Failed to parse error JSON', e);
      }

      // 1. Centralized Logging
      console.group('🚨 FIRESTORE MONITOR: ERROR DETECTED');
      console.error('Timestamp:', new Date().toISOString());
      console.error('Metadata:', errorData);
      console.groupEnd();

      // 2. Integration with External Services (Example)
      // LogRocket.captureException(error, { tags: { operation: errorData.operationType } });

      // 3. User Feedback
      const isPermission = error.message?.toLowerCase().includes('permission') || 
                           errorData.error?.toLowerCase().includes('permission');
      
      if (isPermission) {
        toast({
          title: "Access Restricted",
          description: "Your account does not have permission for this request. Security event logged.",
          variant: "destructive",
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component doesn't render anything
}
