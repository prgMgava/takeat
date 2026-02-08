import { useState } from 'react';
import { Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
  restaurantId: string;
  restaurantName: string;
}

export default function ProductCard({ product, restaurantId, restaurantName }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const price = product.promotionalPrice || product.price;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }

    // Check required options
    const requiredOptions = product.options?.filter((o) => o.isRequired) || [];
    for (const option of requiredOptions) {
      if (!selectedOptions[option.id] || selectedOptions[option.id].length < option.minSelections) {
        toast.error(`Selecione ${option.name}`);
        setShowOptions(true);
        return;
      }
    }

    const optionsPrice = Object.entries(selectedOptions).reduce((total, [optionId, itemIds]) => {
      const option = product.options?.find((o) => o.id === optionId);
      const itemsPrice = itemIds.reduce((sum, itemId) => {
        const item = option?.items.find((i) => i.id === itemId);
        return sum + (item?.price || 0);
      }, 0);
      return total + itemsPrice;
    }, 0);

    addItem(restaurantId, restaurantName, {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: price,
      options: Object.entries(selectedOptions).map(([optionId, itemIds]) => ({
        optionId,
        itemIds,
        price: itemIds.reduce((sum, itemId) => {
          const option = product.options?.find((o) => o.id === optionId);
          const item = option?.items.find((i) => i.id === itemId);
          return sum + (item?.price || 0);
        }, 0),
      })),
    });

    // Visual feedback
    setAddedToCart(true);
    toast.success('Item adicionado ao carrinho');

    setTimeout(() => {
      setAddedToCart(false);
      setShowOptions(false);
      setSelectedOptions({});
      setQuantity(1);
    }, 1500);
  };

  const toggleOption = (optionId: string, itemId: string, maxSelections: number) => {
    setSelectedOptions((prev) => {
      const current = prev[optionId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [optionId]: current.filter((id) => id !== itemId) };
      }
      if (current.length >= maxSelections) {
        if (maxSelections === 1) {
          return { ...prev, [optionId]: [itemId] };
        }
        return prev;
      }
      return { ...prev, [optionId]: [...current, itemId] };
    });
  };

  const totalPrice = (price + Object.entries(selectedOptions).reduce((total, [optionId, itemIds]) => {
    const option = product.options?.find((o) => o.id === optionId);
    return total + itemIds.reduce((sum, itemId) => {
      const item = option?.items.find((i) => i.id === itemId);
      return sum + (item?.price || 0);
    }, 0);
  }, 0)) * quantity;

  return (
    <div className={`bg-white rounded-lg shadow p-4 transition-all ${addedToCart ? 'ring-2 ring-green-500' : ''}`}>
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {product.promotionalPrice ? (
              <>
                <span className="line-through text-gray-400 text-xs sm:text-sm">
                  R$ {product.price.toFixed(2)}
                </span>
                <span className="font-semibold text-green-600 text-sm sm:text-base">
                  R$ {product.promotionalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-semibold text-sm sm:text-base">R$ {product.price.toFixed(2)}</span>
            )}
          </div>
          {product.servings && product.servings > 1 && (
            <p className="text-xs text-gray-400 mt-1">Serve {product.servings} pessoa(s)</p>
          )}
        </div>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0"
          />
        )}
      </div>

      {!product.isAvailable ? (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Produto indisponível no momento</span>
        </div>
      ) : (
        <>
          {product.options && product.options.length > 0 && (
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="mt-3 text-orange-500 text-sm hover:underline font-medium"
            >
              {showOptions ? '▲ Ocultar opções' : '▼ Ver opções e personalizar'}
            </button>
          )}

          {showOptions && product.options && (
            <div className="mt-3 space-y-4 border-t pt-3">
              {product.options.map((option) => (
                <div key={option.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{option.name}</span>
                    {option.isRequired && (
                      <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded">Obrigatório</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {option.minSelections === option.maxSelections
                      ? `Escolha ${option.maxSelections}`
                      : `Escolha de ${option.minSelections} a ${option.maxSelections}`}
                  </p>
                  <div className="space-y-1">
                    {option.items.map((item) => {
                      const isSelected = selectedOptions[option.id]?.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-50 border-2 border-orange-500'
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </div>
                          {item.price > 0 && (
                            <span className="text-sm text-gray-600 font-medium">
                              + R$ {item.price.toFixed(2)}
                            </span>
                          )}
                          <input
                            type={option.maxSelections === 1 ? 'radio' : 'checkbox'}
                            name={option.id}
                            checked={isSelected}
                            onChange={() => toggleOption(option.id, item.id, option.maxSelections)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-center gap-3 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={`flex-1 sm:flex-none py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check className="h-4 w-4" />
                  Adicionado!
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Adicionar</span>
                  <span className="ml-1">R$ {totalPrice.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
