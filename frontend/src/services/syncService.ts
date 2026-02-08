import api from '../lib/api';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import type { QueuedOrder } from '../store/offlineQueueStore';
import { isNetworkError } from '../hooks/useOnlineStatus';

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ queueId: string; error: string }>;
}

/**
 * Processa um único pedido da fila
 */
async function processQueuedOrder(order: QueuedOrder): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  errorCode?: string;
  stockConflict?: QueuedOrder['stockConflict'];
}> {
  try {
    const orderData = {
      restaurantId: order.restaurantId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        options: item.options,
        notes: item.notes,
      })),
      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryState: order.deliveryState,
      deliveryZipCode: order.deliveryZipCode,
      deliveryPhone: order.deliveryPhone,
      notes: order.notes,
    };

    const response = await api.post('/orders', orderData);

    return {
      success: true,
      orderId: response.data.data.order.id,
      orderNumber: response.data.data.order.orderNumber,
    };
  } catch (error: unknown) {
    // Erro de rede - manter na fila para retry
    if (isNetworkError(error)) {
      return {
        success: false,
        error: 'Sem conexão com o servidor',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Erro de estoque - conflito tardio
    const axiosError = error as { response?: { data?: { code?: string; message?: string; data?: { products?: QueuedOrder['stockConflict'] } } } };

    if (axiosError.response?.data?.code === 'INSUFFICIENT_STOCK') {
      return {
        success: false,
        error: axiosError.response.data.message || 'Estoque insuficiente',
        errorCode: 'INSUFFICIENT_STOCK',
        stockConflict: axiosError.response.data.data?.products,
      };
    }

    // Outros erros de servidor
    return {
      success: false,
      error: axiosError.response?.data?.message || 'Erro ao processar pedido',
      errorCode: axiosError.response?.data?.code || 'SERVER_ERROR',
    };
  }
}

/**
 * Sincroniza todos os pedidos pendentes na fila
 */
export async function syncOfflineQueue(): Promise<SyncResult> {
  const store = useOfflineQueueStore.getState();

  if (store.isSyncing) {
    console.log('[Sync] Sincronização já em andamento');
    return { success: true, processed: 0, failed: 0, errors: [] };
  }

  const pendingOrders = store.getPendingOrders();

  if (pendingOrders.length === 0) {
    console.log('[Sync] Nenhum pedido pendente para sincronizar');
    return { success: true, processed: 0, failed: 0, errors: [] };
  }

  console.log(`[Sync] Iniciando sincronização de ${pendingOrders.length} pedido(s)`);
  store.setSyncing(true);

  const result: SyncResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const order of pendingOrders) {
    // Verificar se já tentou muitas vezes
    if (order.retryCount >= order.maxRetries) {
      store.updateStatus(order.id, 'failed', 'Número máximo de tentativas excedido', 'MAX_RETRIES');
      result.failed++;
      result.errors.push({ queueId: order.id, error: 'Número máximo de tentativas excedido' });
      continue;
    }

    // Marcar como processando
    store.updateStatus(order.id, 'processing');
    store.incrementRetry(order.id);

    // Tentar processar
    const processResult = await processQueuedOrder(order);

    if (processResult.success) {
      // Sucesso!
      store.setOrderResult(order.id, processResult.orderId!, processResult.orderNumber!);
      result.processed++;
      console.log(`[Sync] Pedido ${order.id} sincronizado com sucesso: ${processResult.orderNumber}`);
    } else if (processResult.errorCode === 'NETWORK_ERROR') {
      // Erro de rede - voltar para pending para tentar depois
      store.updateStatus(order.id, 'pending', processResult.error, processResult.errorCode);
      result.success = false;
      console.log(`[Sync] Pedido ${order.id} falhou por erro de rede, será tentado novamente`);
      // Parar sincronização se não há conexão
      break;
    } else if (processResult.stockConflict) {
      // Conflito de estoque - marcar como falhou com detalhes
      store.setStockConflict(order.id, processResult.stockConflict);
      store.updateStatus(order.id, 'failed', processResult.error, processResult.errorCode);
      result.failed++;
      result.errors.push({ queueId: order.id, error: processResult.error || 'Estoque insuficiente' });
      console.log(`[Sync] Pedido ${order.id} falhou por estoque insuficiente`);
    } else {
      // Outro erro - marcar como falhou
      store.updateStatus(order.id, 'failed', processResult.error, processResult.errorCode);
      result.failed++;
      result.errors.push({ queueId: order.id, error: processResult.error || 'Erro desconhecido' });
      console.log(`[Sync] Pedido ${order.id} falhou: ${processResult.error}`);
    }
  }

  store.setSyncing(false);
  console.log(`[Sync] Sincronização finalizada. Processados: ${result.processed}, Falhas: ${result.failed}`);

  return result;
}

/**
 * Hook para usar o serviço de sincronização
 */
export function useSyncService() {
  const { isOnline, isSyncing, queue, getPendingOrders, getFailedOrders } = useOfflineQueueStore();

  const sync = async () => {
    if (!isOnline) {
      console.log('[Sync] Offline - sincronização adiada');
      return null;
    }
    return syncOfflineQueue();
  };

  const pendingCount = getPendingOrders().length;
  const failedCount = getFailedOrders().length;
  const totalQueued = queue.length;

  return {
    sync,
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    totalQueued,
    hasQueuedOrders: pendingCount > 0,
    hasFailedOrders: failedCount > 0,
  };
}
