import { useEffect, useCallback } from 'react';
import { useOfflineQueueStore } from '../store/offlineQueueStore';


export function useOnlineStatus() {
  const { isOnline, setOnlineStatus } = useOfflineQueueStore();

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Conexão restaurada');
      setOnlineStatus(true);
    };

    const handleOffline = () => {
      console.log('[Network] Conexão perdida');
      setOnlineStatus(false);
    };


    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);


    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
}


export function isNetworkError(error: unknown): boolean {
  if (!error) return false;


  if (error instanceof Error) {

    const networkErrorMessages = [
      'network error',
      'net::err_',
      'failed to fetch',
      'networkerror',
      'timeout',
      'econnrefused',
      'econnreset',
      'enotfound',
    ];

    const message = error.message.toLowerCase();
    if (networkErrorMessages.some((msg) => message.includes(msg))) {
      return true;
    }


    const axiosError = error as Error & { code?: string; response?: unknown };
    if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNABORTED') {
      return true;
    }


    if (!axiosError.response) {
      return true;
    }
  }

  return false;
}


export function useNetworkCheck() {
  const { setOnlineStatus } = useOfflineQueueStore();

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok;
      setOnlineStatus(isOnline);
      return isOnline;
    } catch {
      setOnlineStatus(false);
      return false;
    }
  }, [setOnlineStatus]);

  return { checkConnection };
}
