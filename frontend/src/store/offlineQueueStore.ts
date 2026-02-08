import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QueueItemStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface QueuedOrder {
  id: string;
  createdAt: string;
  status: QueueItemStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  errorCode?: string;
  // Order data
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    options: Array<{
      optionId: string;
      itemIds: string[];
    }>;
    notes?: string;
  }>;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZipCode?: string;
  deliveryPhone?: string;
  notes?: string;
  total: number;
  // Response data when successful
  orderNumber?: string;
  orderId?: string;
  // Conflict data
  stockConflict?: Array<{
    productId: string;
    productName: string;
    missingInputs: Array<{
      inputName: string;
      required: number;
      available: number;
      unit: string;
    }>;
  }>;
}

interface OfflineQueueState {
  queue: QueuedOrder[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  // Actions
  addToQueue: (order: Omit<QueuedOrder, 'id' | 'createdAt' | 'status' | 'retryCount' | 'maxRetries'>) => string;
  removeFromQueue: (id: string) => void;
  updateStatus: (id: string, status: QueueItemStatus, error?: string, errorCode?: string) => void;
  setStockConflict: (id: string, conflict: QueuedOrder['stockConflict']) => void;
  setOrderResult: (id: string, orderId: string, orderNumber: string) => void;
  incrementRetry: (id: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  clearProcessedOrders: () => void;
  getPendingOrders: () => QueuedOrder[];
  getFailedOrders: () => QueuedOrder[];
  getSuccessOrders: () => QueuedOrder[];
  hasUnacknowledgedFailures: () => boolean;
  acknowledgeFailure: (id: string) => void;
}

const generateQueueId = (): string => {
  return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncAttempt: null,

      addToQueue: (orderData) => {
        const id = generateQueueId();
        const queuedOrder: QueuedOrder = {
          ...orderData,
          id,
          createdAt: new Date().toISOString(),
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
        };

        set((state) => ({
          queue: [...state.queue, queuedOrder],
        }));

        return id;
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        }));
      },

      updateStatus: (id, status, error, errorCode) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, status, lastError: error, errorCode }
              : item
          ),
        }));
      },

      setStockConflict: (id, conflict) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, stockConflict: conflict, status: 'failed' as QueueItemStatus }
              : item
          ),
        }));
      },

      setOrderResult: (id, orderId, orderNumber) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, orderId, orderNumber, status: 'success' as QueueItemStatus }
              : item
          ),
        }));
      },

      incrementRetry: (id) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, retryCount: item.retryCount + 1 }
              : item
          ),
        }));
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      setSyncing: (isSyncing) => {
        set({ isSyncing, lastSyncAttempt: isSyncing ? new Date().toISOString() : get().lastSyncAttempt });
      },

      clearProcessedOrders: () => {
        set((state) => ({
          queue: state.queue.filter((item) => item.status === 'pending' || item.status === 'processing'),
        }));
      },

      getPendingOrders: () => {
        return get().queue.filter((item) => item.status === 'pending');
      },

      getFailedOrders: () => {
        return get().queue.filter((item) => item.status === 'failed');
      },

      getSuccessOrders: () => {
        return get().queue.filter((item) => item.status === 'success');
      },

      hasUnacknowledgedFailures: () => {
        return get().queue.some(
          (item) => item.status === 'failed' && !item.lastError?.includes('[acknowledged]')
        );
      },

      acknowledgeFailure: (id) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, lastError: `[acknowledged] ${item.lastError || ''}` }
              : item
          ),
        }));
      },
    }),
    {
      name: 'offline-queue-storage',
      version: 1,
    }
  )
);
