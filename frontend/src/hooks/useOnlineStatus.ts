import { useEffect, useCallback } from 'react';
import { useOfflineQueueStore } from '../store/offlineQueueStore';

/**
 * Hook para monitorar status de conexão online/offline
 * Automaticamente atualiza o store quando a conexão muda
 */
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

    // Listeners para eventos de conexão
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
}

/**
 * Verifica se um erro é de rede (sem conexão)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Axios network error
  if (error instanceof Error) {
    // Mensagens comuns de erro de rede
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

    // Axios specific: code ERR_NETWORK
    const axiosError = error as Error & { code?: string; response?: unknown };
    if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNABORTED') {
      return true;
    }

    // Se não há response, provavelmente é erro de rede
    if (!axiosError.response) {
      return true;
    }
  }

  return false;
}

/**
 * Hook para verificar conectividade real (não apenas navigator.onLine)
 * Faz um ping ao servidor para verificar se há conexão real
 */
export function useNetworkCheck() {
  const { setOnlineStatus } = useOfflineQueueStore();

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Tenta fazer um request leve ao servidor
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
