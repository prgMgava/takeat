import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, Phone, ShoppingCart, ChevronLeft } from 'lucide-react';
import api from '../lib/api';
import type { Restaurant, Category } from '../types';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCartStore } from '../store/cartStore';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { items, getTotal } = useCartStore();

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getTotal();

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/restaurants/${id}`);
      setRestaurant(response.data.data.restaurant);
      if (response.data.data.restaurant.categories?.length > 0) {
        setSelectedCategory(response.data.data.restaurant.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
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
        <p className="text-gray-500 text-lg">Restaurante não encontrado</p>
        <Link to="/restaurants" className="text-orange-500 hover:underline mt-4 inline-block">
          Voltar para restaurantes
        </Link>
      </div>
    );
  }

  const categories = restaurant.categories || [];
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="pb-24 lg:pb-8">

      <div className="lg:hidden sticky top-16 z-20 bg-white border-b px-4 py-2">
        <Link to="/restaurants" className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Voltar</span>
        </Link>
      </div>


      <div className="h-40 sm:h-48 md:h-64 relative">
        <img
          src={restaurant.bannerUrl || 'https://placehold.co/1200x400/gray/white?text=Restaurant'}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl sm:text-2xl font-bold bg-red-500 px-4 py-2 rounded-lg">
              Fechado
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10">

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {restaurant.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{restaurant.name}</h1>
              <p className="text-gray-500 text-sm sm:text-base">{restaurant.cuisine}</p>
              {restaurant.description && (
                <p className="text-gray-600 mt-2 text-sm sm:text-base line-clamp-2">{restaurant.description}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              {restaurant.estimatedDeliveryTime || '30-45 min'}
            </span>
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-none">{restaurant.address}</span>
            </span>
            {restaurant.phone && (
              <span className="flex items-center">
                <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                {restaurant.phone}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="bg-gray-100 px-3 py-1.5 rounded-full">
              Entrega: R$ {restaurant.deliveryFee?.toFixed(2)}
            </span>
            <span className="bg-gray-100 px-3 py-1.5 rounded-full">
              Pedido mínimo: R$ {restaurant.minimumOrder?.toFixed(2)}
            </span>
          </div>
        </div>


        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">

          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
              <h2 className="font-semibold mb-3">Categorias</h2>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-orange-100 text-orange-600 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>


          <div className="lg:hidden overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>


          <div className="lg:col-span-3">
            {currentCategory && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-2">{currentCategory.name}</h2>
                {currentCategory.description && (
                  <p className="text-gray-500 mb-4 text-sm">{currentCategory.description}</p>
                )}
                <div className="grid gap-3 sm:gap-4">
                  {currentCategory.products?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      restaurantId={restaurant.id}
                      restaurantName={restaurant.name}
                    />
                  ))}
                  {(!currentCategory.products || currentCategory.products.length === 0) && (
                    <div className="text-center py-8 bg-white rounded-lg">
                      <p className="text-gray-500">Nenhum produto nesta categoria</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {cartItemCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30">
          <Link
            to="/cart"
            className="flex items-center justify-between bg-orange-500 text-white py-4 px-6 rounded-xl shadow-lg hover:bg-orange-600 transition-colors animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <span className="font-medium">Ver carrinho</span>
            </div>
            <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
