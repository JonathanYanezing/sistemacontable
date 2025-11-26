import { useState, useRef, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

interface ProductSelectorProps {
  value: string;
  onChange: (product: any) => void;
  products: any[];
  placeholder?: string;
  allowManualInput?: boolean;
  onManualInput?: (value: string) => void;
}

export default function ProductSelector({ value, onChange, products, placeholder = "Buscar producto...", allowManualInput = false, onManualInput }: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const product = products.find((p: any) => p.id === value || p.code === value || p.name === value);
      if (product) {
        setSelectedProduct(product);
      } else {
        // Si no es un producto del catálogo, permitir descripción manual
        setSelectedProduct(null);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [value, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter((product: any) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product: any) => {
    setSelectedProduct(product);
    onChange(product);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    if (allowManualInput && onManualInput) {
      onManualInput(inputValue);
      // Si hay un producto seleccionado y el usuario está escribiendo, limpiar la selección
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    }
    // Si hay texto, abrir el dropdown
    if (inputValue && !isOpen) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (allowManualInput && value && !selectedProduct) {
      setSearchTerm(value);
    }
  }, [value, allowManualInput, selectedProduct]);

  return (
    <div className="relative" ref={dropdownRef}>
      {allowManualInput ? (
        <div className="relative">
          <input
            type="text"
            value={value || searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (!value) {
                setSearchTerm('');
              }
            }}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white hover:border-primary-500 focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedProduct ? (
              <>
                <Package className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span className="truncate">{selectedProduct.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">({selectedProduct.code})</span>
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </div>
            ) : (
              filteredProducts.map((product: any) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        Código: {product.code} | Precio: ${product.salePrice?.toFixed(2) || '0.00'} | Stock: {product.stock || 0}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

