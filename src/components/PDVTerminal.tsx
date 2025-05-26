
import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, Send, Printer, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ProductGrid from './ProductGrid';
import OrderManagement from './OrderManagement';
import CheckoutDialog from './CheckoutDialog';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface PDVTerminalProps {
  onBack: () => void;
  onSendToKitchen: (order: any) => void;
}

const PDVTerminal: React.FC<PDVTerminalProps> = ({ onBack, onSendToKitchen }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const { sendToKitchen, loading } = OrderManagement({ 
    cart, 
    onClearCart: () => setCart([]) 
  });

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-pdv text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20 touch-button"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Terminal PDV - Pastel Neto</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{getTotalItems()} itens</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="desktop-grid mobile-grid gap-6 p-6">
        {/* Products Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Produtos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProductGrid 
                onAddToCart={addToCart}
                cart={cart}
                onUpdateQuantity={updateQuantity}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>Carrinho de Compras</span>
                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    Limpar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para começar</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="cart-item flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            R$ {item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-green-600">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {getTotalPrice().toFixed(2)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={sendToKitchen}
                        disabled={loading}
                        className="w-full touch-button bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {loading ? 'Enviando...' : 'Enviar para Cozinha'}
                      </Button>
                      
                      <Button
                        onClick={() => setShowCheckout(true)}
                        variant="outline"
                        className="w-full touch-button border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Finalizar Venda
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      {showCheckout && (
        <CheckoutDialog
          cart={cart}
          total={getTotalPrice()}
          onClose={() => setShowCheckout(false)}
          onComplete={() => {
            setShowCheckout(false);
            clearCart();
          }}
        />
      )}
    </div>
  );
};

export default PDVTerminal;
