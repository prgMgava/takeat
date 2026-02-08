import { Link } from 'react-router-dom';
import { Clock, MapPin, Star } from 'lucide-react';
import type { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: Props) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative h-40">
        <img
          src={restaurant.bannerUrl || restaurant.logoUrl || 'https://placehold.co/400x200/gray/white?text=Restaurant'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Fechado</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{restaurant.name}</h3>
            <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
          </div>
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
            />
          )}
        </div>
        <div className="mt-3 flex items-center text-sm text-gray-500 space-x-4">
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {restaurant.estimatedDeliveryTime || '30-45 min'}
          </span>
          <span>
            R$ {restaurant.deliveryFee?.toFixed(2)} entrega
          </span>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="truncate">{restaurant.address}</span>
        </div>
        {restaurant.minimumOrder > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            Pedido mínimo: R$ {restaurant.minimumOrder?.toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}
