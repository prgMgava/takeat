import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import type { QueuedOrder } from '../store/offlineQueueStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncOfflineQueue } from '../services/syncService';
import toast from 'react-hot-toast';

export default function OfflineQueueNotification() {
  const isOnline = useOnlineStatus();
  const {
    isSyncing,
    getPendingOrders,
    getFailedOrders,
    getSuccessOrders,
    removeFromQueue,
    acknowledgeFailure,
    clearProcessedOrders,
  } = useOfflineQueueStore();

  const [expanded, setExpanded] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState<QueuedOrder | null>(null);

  const pendingOrders = getPendingOrders();
  const failedOrders = getFailedOrders();
  const successOrders = getSuccessOrders();

  // Auto-sync quando ficar online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        console.log('[AutoSync] Conexão restaurada, sincronizando fila...');
        handleSync();
      }, 2000); // Aguarda 2 segundos para garantir estabilidade

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOrders.length, isSyncing]);

  // Notificar quando pedidos forem sincronizados com sucesso
  useEffect(() => {
    const unacknowledgedSuccess = successOrders.filter(
      (o) => !o.lastError?.includes('[notified]')
    );

    if (unacknowledgedSuccess.length > 0) {
      unacknowledgedSuccess.forEach((order) => {
        toast.success(`Pedido ${order.orderNumber} sincronizado!`, { duration: 5000 });
        // Marcar como notificado
        acknowledgeFailure(order.id);
      });
    }
  }, [successOrders, acknowledgeFailure]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('Sem conexão com a internet');
      return;
    }

    const result = await syncOfflineQueue();

    if (result.processed > 0) {
      toast.success(`${result.processed} pedido(s) sincronizado(s)!`);
    }

    if (result.failed > 0) {
      toast.error(`${result.failed} pedido(s) falharam. Verifique os detalhes.`);
    }
  }, [isOnline]);

  const handleViewConflict = (order: QueuedOrder) => {
    setShowConflictModal(order);
  };

  const handleRemoveOrder = (orderId: string) => {
    if (window.confirm('Tem certeza que deseja remover este pedido da fila?')) {
      removeFromQueue(orderId);
      toast.success('Pedido removido da fila');
    }
  };

  const handleClearProcessed = () => {
    clearProcessedOrders();
    toast.success('Histórico limpo');
  };

  // Não mostrar nada se não há itens relevantes
  if (pendingOrders.length === 0 && failedOrders.length === 0 && isOnline) {
    return null;
  }

  return (
    <>
      {/* Indicador de Status Fixo */}
      <div className="fixed bottom-4 right-4 z-40">
        <div
          className={`rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
            expanded ? 'w-80' : 'w-auto'
          }`}
        >
          {/* Header - Sempre visível */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full flex items-center justify-between gap-3 p-3 ${
              !isOnline
                ? 'bg-red-500 text-white'
                : failedOrders.length > 0
                ? 'bg-amber-500 text-white'
                : pendingOrders.length > 0
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <WifiOff className="h-5 w-5" />
              ) : failedOrders.length > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : pendingOrders.length > 0 ? (
                <Clock className="h-5 w-5 animate-pulse" />
              ) : (
                <Wifi className="h-5 w-5" />
              )}
              <span className="font-medium text-sm">
                {!isOnline
                  ? 'Offline'
                  : failedOrders.length > 0
                  ? `${failedOrders.length} pedido(s) com erro`
                  : pendingOrders.length > 0
                  ? `${pendingOrders.length} pendente(s)`
                  : 'Online'}
              </span>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>

          {/* Conteúdo Expandido */}
          {expanded && (
            <div className="bg-white border border-t-0 rounded-b-lg max-h-80 overflow-y-auto">
              {/* Pedidos Pendentes */}
              {pendingOrders.length > 0 && (
                <div className="p-3 border-b">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Aguardando sincronização
                  </h4>
                  <ul className="space-y-2">
                    {pendingOrders.map((order) => (
                      <li
                        key={order.id}
                        className="text-xs bg-blue-50 p-2 rounded flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">{order.restaurantName}</span>
                          <span className="text-gray-500 ml-2">
                            R$ {order.total.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveOrder(order.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Remover da fila"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pedidos com Erro */}
              {failedOrders.length > 0 && (
                <div className="p-3 border-b">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Falhas na sincronização
                  </h4>
                  <ul className="space-y-2">
                    {failedOrders.map((order) => (
                      <li
                        key={order.id}
                        className="text-xs bg-red-50 p-2 rounded"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{order.restaurantName}</span>
                            <p className="text-red-600 mt-1">
                              {order.errorCode === 'INSUFFICIENT_STOCK'
                                ? 'Estoque insuficiente'
                                : order.lastError?.replace('[acknowledged] ', '')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {order.stockConflict && (
                              <button
                                onClick={() => handleViewConflict(order)}
                                className="p-1 text-amber-600 hover:bg-amber-100 rounded text-[10px]"
                                title="Ver detalhes"
                              >
                                Detalhes
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveOrder(order.id)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pedidos Sincronizados */}
              {successOrders.length > 0 && (
                <div className="p-3 border-b">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sincronizados
                    </span>
                    <button
                      onClick={handleClearProcessed}
                      className="text-[10px] text-gray-500 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  </h4>
                  <ul className="space-y-1">
                    {successOrders.slice(0, 3).map((order) => (
                      <li
                        key={order.id}
                        className="text-xs bg-green-50 p-2 rounded flex justify-between"
                      >
                        <Link
                          to={`/orders/${order.orderId}`}
                          className="text-green-700 hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                        <span className="text-gray-500">
                          R$ {order.total.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ações */}
              <div className="p-3 bg-gray-50">
                <button
                  onClick={handleSync}
                  disabled={!isOnline || isSyncing || pendingOrders.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-500 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing
                    ? 'Sincronizando...'
                    : isOnline
                    ? 'Sincronizar Agora'
                    : 'Aguardando conexão'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Conflito de Estoque */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <h2 className="font-bold text-lg">Conflito de Estoque</h2>
              </div>
              <button
                onClick={() => setShowConflictModal(null)}
                className="p-1 hover:bg-amber-600 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <p className="text-gray-600 mb-4">
                O pedido de <strong>{showConflictModal.restaurantName}</strong> não pôde ser
                processado porque o estoque acabou enquanto você estava offline.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-700">
                  <strong>Pedido feito em:</strong>{' '}
                  {new Date(showConflictModal.createdAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-amber-700">
                  <strong>Total:</strong> R$ {showConflictModal.total.toFixed(2)}
                </p>
              </div>

              {showConflictModal.stockConflict && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Produtos com problema:</h3>
                  {showConflictModal.stockConflict
                    .filter((p) => p.missingInputs?.length > 0)
                    .map((product, idx) => (
                      <div
                        key={idx}
                        className="border border-red-200 rounded-lg p-3 bg-red-50"
                      >
                        <h4 className="font-semibold text-red-700">{product.productName}</h4>
                        <ul className="mt-2 space-y-1">
                          {product.missingInputs.map((input, iIdx) => (
                            <li
                              key={iIdx}
                              className="text-xs flex justify-between bg-white p-2 rounded"
                            >
                              <span>{input.inputName}</span>
                              <span className="text-red-600">
                                Faltam {(input.required - input.available).toFixed(1)}{' '}
                                {input.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => {
                  handleRemoveOrder(showConflictModal.id);
                  setShowConflictModal(null);
                }}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
              >
                Descartar Pedido
              </button>
              <button
                onClick={() => setShowConflictModal(null)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
