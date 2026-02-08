import { AlertTriangle, X, Trash2, RefreshCw } from 'lucide-react';
import type { ProductStockStatus } from '../types';

interface Props {
  products: ProductStockStatus[];
  onClose: () => void;
  onRemoveItem: (productId: string) => void;
  onRetry: () => void;
}

export default function StockAlert({ products, onClose, onRemoveItem, onRetry }: Props) {
  const unavailableProducts = products.filter(p => !p.available);
  const availableProducts = products.filter(p => p.available);

  if (unavailableProducts.length === 0) return null;

  const handleRemoveAll = () => {
    unavailableProducts.forEach(p => onRemoveItem(p.productId));
    onRetry();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-red-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="font-bold text-lg">Estoque Insuficiente</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <p className="text-gray-600 mb-4">
            Os seguintes produtos não têm ingredientes suficientes em estoque:
          </p>

          <div className="space-y-3">
            {unavailableProducts.map((product) => (
              <div key={product.productId} className="border border-red-200 rounded-lg overflow-hidden bg-red-50">
                <div className="flex items-center justify-between p-3 border-b border-red-200">
                  <div>
                    <h3 className="font-semibold text-red-700">{product.productName}</h3>
                    <p className="text-xs text-gray-500">Qtd no pedido: {product.quantity || 1}</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(product.productId)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-2">Ingredientes em falta:</p>
                  <ul className="space-y-1">
                    {product.missingInputs.map((input, idx) => (
                      <li key={idx} className="text-xs flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-medium text-gray-700">{input.inputName}</span>
                        <span className="text-red-600 text-[11px]">
                          Faltam {(input.required - input.available).toFixed(1)} {input.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Available products info */}
          {availableProducts.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>{availableProducts.length}</strong> {availableProducts.length === 1 ? 'produto está' : 'produtos estão'} disponível para pedido:
              </p>
              <ul className="mt-1 text-sm text-green-600">
                {availableProducts.map(p => (
                  <li key={p.productId}>✓ {p.productName}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 space-y-2">
          {availableProducts.length > 0 ? (
            <>
              <button
                onClick={handleRemoveAll}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Remover itens sem estoque e continuar
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm transition-colors"
              >
                Ajustar manualmente
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-medium transition-colors"
            >
              Voltar ao carrinho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
