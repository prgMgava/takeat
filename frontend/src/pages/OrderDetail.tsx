import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Phone, ArrowLeft, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Order } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para Entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const paymentLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) return;

    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'Cancelado pelo cliente' });
      toast.success('Pedido cancelado');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar pedido');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Pedido não encontrado</p>
      </div>
    );
  }

  const canCancel = order.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para pedidos
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pedido #{order.orderNumber}</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(order.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}
          >
            {statusLabels[order.status]}
          </span>
        </div>


        <div className="border-b pb-4 mb-4">
          <h2 className="font-semibold mb-2">{order.restaurant?.name}</h2>
          <p className="text-sm text-gray-500 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {order.restaurant?.address}
          </p>
        </div>


        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold mb-3">Itens do Pedido</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-2">
              <div>
                <span className="font-medium">{item.quantity}x</span> {item.productName}
                {item.options && item.options.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {item.options.map((o) => `${o.optionName}: ${o.itemName}`).join(' • ')}
                  </p>
                )}
              </div>
              <span>R$ {(item.totalPrice ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>


        {order.isDelivery && order.deliveryAddress && (
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
            <p className="text-gray-600">{order.deliveryAddress}</p>
          </div>
        )}


        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold mb-2">Pagamento</h3>
          <p className="text-gray-600">{paymentLabels[order.paymentMethod]}</p>
        </div>


        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>R$ {(order.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Taxa de entrega</span>
            <span>R$ {(order.deliveryFee ?? 0).toFixed(2)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>- R$ {(order.discount ?? 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>R$ {(order.total ?? 0).toFixed(2)}</span>
          </div>
        </div>


        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            {cancelling ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Cancelar Pedido
              </>
            )}
          </button>
        )}


        {order.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Observações:</strong> {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
