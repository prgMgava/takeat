import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Store, Package, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { Restaurant, Order } from '../types';
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

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restaurantRes, ordersRes, statsRes] = await Promise.all([
        api.get('/restaurants/owner/me').catch(() => null),
        api.get('/orders?limit=10').catch(() => ({ data: { data: { orders: [] } } })),
        api.get('/orders/stats').catch(() => ({ data: { data: { stats: {} } } })),
      ]);

      if (restaurantRes?.data?.data?.restaurant) {
        setRestaurant(restaurantRes.data.data.restaurant);
      }
      setOrders(ordersRes.data.data.orders);
      setStats(statsRes.data.data.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success('Status atualizado');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const toggleRestaurantStatus = async () => {
    if (!restaurant) return;
    try {
      await api.patch(`/restaurants/${restaurant.id}/toggle-status`);
      toast.success(`Restaurante ${restaurant.isOpen ? 'fechado' : 'aberto'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Você ainda não tem um restaurante</h1>
        <p className="text-gray-500 mb-8">Cadastre seu restaurante para começar a vender</p>
        <Link
          to="/dashboard/restaurant/new"
          className="inline-flex items-center bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Cadastrar Restaurante
        </Link>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <p className="text-gray-500">{restaurant.cuisine}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleRestaurantStatus}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                restaurant.isOpen
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {restaurant.isOpen ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Aberto
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  Fechado
                </>
              )}
            </button>
            <Link
              to="/dashboard/restaurant/edit"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Hoje</p>
              <p className="text-xl font-bold">{stats?.todayOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Faturamento Hoje</p>
              <p className="text-xl font-bold">R$ {(stats?.todayRevenue || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-xl font-bold">{stats?.statusCounts?.PENDING || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold">R$ {(stats?.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <Link
          to="/dashboard/products"
          className="bg-white rounded-lg shadow-md px-4 py-3 hover:shadow-lg flex items-center gap-2"
        >
          <Plus className="h-5 w-5 text-orange-500" />
          Gerenciar Produtos
        </Link>
        <Link
          to="/dashboard/categories"
          className="bg-white rounded-lg shadow-md px-4 py-3 hover:shadow-lg flex items-center gap-2"
        >
          <Plus className="h-5 w-5 text-orange-500" />
          Gerenciar Categorias
        </Link>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            Pedidos Pendentes ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <p className="font-bold text-orange-500">R$ {order.total.toFixed(2)}</p>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {order.items?.map((item) => (
                    <p key={item.id}>{item.quantity}x {item.productName}</p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Orders */}
      {preparingOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Em Preparo ({preparingOrders.length})</h2>
          <div className="space-y-4">
            {preparingOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{statusLabels[order.status]}</p>
                  </div>
                  <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {order.items?.map((item) => (
                    <p key={item.id}>{item.quantity}x {item.productName}</p>
                  ))}
                </div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PREPARING">Preparando</option>
                  <option value="READY">Pronto</option>
                  <option value="OUT_FOR_DELIVERY">Saiu para Entrega</option>
                  <option value="DELIVERED">Entregue</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
