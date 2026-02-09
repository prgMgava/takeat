import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import { isNetworkError } from '../hooks/useOnlineStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import StockAlert from '../components/StockAlert';
import type { StockCheckResponse, ProductStockStatus } from '../types';

interface CheckoutForm {
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
  isDelivery: boolean;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  deliveryPhone: string;
  notes: string;
}

export default function Cart() {
  const [loading, setLoading] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockChecked, setStockChecked] = useState(false);
  const [stockError, setStockError] = useState<ProductStockStatus[] | null>(null);
  const [unavailableProductIds, setUnavailableProductIds] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addToQueue, isOnline } = useOfflineQueueStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      paymentMethod: 'PIX',
      isDelivery: true,
      deliveryCity: '',
      deliveryState: 'SP',
    },
  });

  const isDelivery = watch('isDelivery');
  const total = getTotal();
  const deliveryFee = isDelivery ? 5 : 0;
  const finalTotal = total + deliveryFee;

  // Verificar estoque antes de finalizar
  const checkStock = async (): Promise<boolean> => {
    setCheckingStock(true);
    setStockError(null);

    try {
      const response = await api.post<{ success: boolean; data: StockCheckResponse }>('/inputs/check-stock', {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      const { allAvailable, products } = response.data.data;

      if (!allAvailable) {
        setStockError(products);
        // Marcar produtos sem estoque
        const unavailable = new Set(products.filter(p => !p.available).map(p => p.productId));
        setUnavailableProductIds(unavailable);
        return false;
      }

      setStockChecked(true);
      setUnavailableProductIds(new Set());
      return true;
    } catch (error: any) {
      // Se a API não existe ou erro de conexão, permitir continuar
      if (error.response?.status === 404) {
        console.warn('Stock check API not available, proceeding...');
        return true;
      }
      toast.error('Erro ao verificar estoque. Tente novamente.');
      return false;
    } finally {
      setCheckingStock(false);
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!isAuthenticated) {
      toast.error('Faça login para finalizar o pedido');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    // Validação de endereço para delivery
    if (data.isDelivery && !data.deliveryAddress?.trim()) {
      toast.error('Informe o endereço de entrega');
      return;
    }

    // Se online, verificar estoque antes de criar pedido
    // Se offline, pular verificação e deixar o pedido ir para a fila
    if (isOnline) {
      const stockOk = await checkStock();
      if (!stockOk) {
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          options: item.options.map((opt) => ({
            optionId: opt.optionId,
            itemIds: opt.itemIds,
          })),
          notes: item.notes,
        })),
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity || 'São Paulo',
        deliveryState: data.deliveryState || 'SP',
        deliveryZipCode: data.deliveryZipCode || '00000-000',
        deliveryPhone: data.deliveryPhone || user?.phone || '',
        notes: data.notes,
      };

      const response = await api.post('/orders', orderData);
      clearCart();
      toast.success('Pedido realizado com sucesso!');
      navigate(`/orders/${response.data.data.order.id}`);
    } catch (error: any) {
      // Verificar se é erro de rede - salvar na fila offline
      if (isNetworkError(error)) {
        const queueId = addToQueue({
          restaurantId: restaurantId!,
          restaurantName: restaurantName || 'Restaurante',
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            options: item.options.map((opt) => ({
              optionId: opt.optionId,
              itemIds: opt.itemIds,
            })),
            notes: item.notes,
          })),
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity || 'São Paulo',
          deliveryState: data.deliveryState || 'SP',
          deliveryZipCode: data.deliveryZipCode || '00000-000',
          deliveryPhone: data.deliveryPhone || user?.phone || '',
          notes: data.notes,
          total: finalTotal,
        });

        console.log('[Offline] Pedido salvo na fila:', queueId);
        clearCart();
        toast.success(
          'Sem conexão! Pedido salvo e será enviado automaticamente quando a internet voltar.',
          { duration: 6000, icon: '📱' }
        );
        return;
      }

      const message = error.response?.data?.message || 'Erro ao realizar pedido';

      // Verificar se é erro de estoque com dados estruturados
      if (error.response?.data?.code === 'INSUFFICIENT_STOCK') {
        const stockData = error.response?.data?.data?.products as ProductStockStatus[] | undefined;

        if (stockData && stockData.length > 0) {
          // Usar dados estruturados do backend
          setStockError(stockData);
          const unavailable = new Set(stockData.filter(p => !p.available).map(p => p.productId));
          setUnavailableProductIds(unavailable);
        } else {
          // Fallback: verificar estoque via endpoint
          toast.error('Estoque insuficiente de ingredientes');
          await checkStock();
        }
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset stock check quando carrinho mudar
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
    setStockChecked(false);
    setStockError(null);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    setStockChecked(false);
    setStockError(null);
    // Remover da lista de indisponíveis
    setUnavailableProductIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  // Handler para tentar novamente após remover itens
  const handleRetryOrder = () => {
    setStockError(null);
    // Se ainda tem itens, tenta submeter novamente
    if (items.length > 0) {
      formRef.current?.requestSubmit();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
        <ShoppingBag className="h-20 w-20 text-gray-300 mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">Seu carrinho está vazio</h1>
        <p className="text-gray-500 mb-8 text-center">Adicione itens de um restaurante para continuar</p>
        <Link
          to="/restaurants"
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Ver Restaurantes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

      {stockError && (
        <StockAlert
          products={stockError}
          onClose={() => setStockError(null)}
          onRemoveItem={handleRemoveItem}
          onRetry={handleRetryOrder}
        />
      )}

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Carrinho</h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{restaurantName}</h2>
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Limpar carrinho
              </button>
            </div>

            {items.map((item) => {
              const isUnavailable = unavailableProductIds.has(item.productId);
              return (
                <div
                  key={item.productId}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 border-b last:border-0 transition-colors ${
                    isUnavailable ? 'bg-red-50 -mx-4 px-4 border-red-200' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${isUnavailable ? 'text-red-700' : ''}`}>
                        {item.productName}
                      </h3>
                      {isUnavailable && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-3 w-3" />
                          Sem estoque
                        </span>
                      )}
                    </div>
                    {item.options.length > 0 && (
                      <p className="text-sm text-gray-500 truncate">
                        {item.options.map((o) => o.itemIds.join(', ')).join(' \u2022 ')}
                      </p>
                    )}
                    <p className="text-orange-500 font-semibold mt-1">
                      R$ {(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>


          {stockChecked && !stockError && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">
                Todos os ingredientes disponíveis em estoque!
              </p>
            </div>
          )}
        </div>


        <div className="lg:col-span-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-md p-4 lg:sticky lg:top-20"
          >
            <h2 className="font-semibold text-lg mb-4">Finalizar Pedido</h2>


            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de entrega</label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isDelivery
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="true"
                    {...register('isDelivery')}
                    className="sr-only"
                  />
                  <span className="font-medium">Delivery</span>
                </label>
                <label
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    !isDelivery
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value=""
                    {...register('isDelivery')}
                    className="sr-only"
                  />
                  <span className="font-medium">Retirada</span>
                </label>
              </div>
            </div>


            {isDelivery && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Endereço de entrega <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('deliveryAddress', {
                      required: isDelivery ? 'Endereço é obrigatório' : false,
                    })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                      errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={2}
                    placeholder="Rua, número, complemento..."
                  />
                  {errors.deliveryAddress && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.deliveryAddress.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      {...register('deliveryCity')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CEP</label>
                    <input
                      type="text"
                      {...register('deliveryZipCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefone para contato</label>
                  <input
                    type="tel"
                    {...register('deliveryPhone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            )}


            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'PIX', label: 'PIX' },
                  { value: 'CREDIT_CARD', label: 'Crédito' },
                  { value: 'DEBIT_CARD', label: 'Débito' },
                  { value: 'CASH', label: 'Dinheiro' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                      watch('paymentMethod') === method.value
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method.value}
                      {...register('paymentMethod')}
                      className="sr-only"
                    />
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>


            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                {...register('notes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={2}
                placeholder="Ex: Sem cebola, troco para R$ 50..."
              />
            </div>


            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              {isDelivery && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-orange-500">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading || checkingStock}
              className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {loading || checkingStock ? (
                <>
                  <LoadingSpinner size="sm" />
                  {checkingStock ? 'Verificando estoque...' : 'Processando...'}
                </>
              ) : (
                'Finalizar Pedido'
              )}
            </button>


            <p className="text-xs text-gray-500 text-center mt-3">
              🔒 Pagamento seguro • Seus dados estão protegidos
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
