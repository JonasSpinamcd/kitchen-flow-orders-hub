
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Printer,
  ArrowLeft,
  DollarSign
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  paymentMethod?: string;
  amountPaid?: number;
  change?: number;
}

interface PDVTerminalProps {
  onBack: () => void;
  onSendToKitchen: (order: Order) => void;
}

const mockProducts: Product[] = [
  { id: '1', name: 'Hambúrguer Clássico', price: 25.90, category: 'Lanches' },
  { id: '2', name: 'Cheeseburger', price: 28.90, category: 'Lanches' },
  { id: '3', name: 'Batata Frita', price: 12.90, category: 'Acompanhamentos' },
  { id: '4', name: 'Refrigerante', price: 6.90, category: 'Bebidas' },
  { id: '5', name: 'Suco Natural', price: 8.90, category: 'Bebidas' },
  { id: '6', name: 'Pizza Margherita', price: 35.90, category: 'Pizzas' },
];

const PDVTerminal: React.FC<PDVTerminalProps> = ({ onBack, onSendToKitchen }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', ...Array.from(new Set(mockProducts.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'Todos' 
    ? mockProducts 
    : mockProducts.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  const handleFinalizeSale = () => {
    const order: Order = {
      id: Date.now().toString(),
      items: cart,
      total: cartTotal,
      timestamp: new Date(),
      paymentMethod,
      amountPaid: parseFloat(amountPaid) || 0,
      change: parseFloat(amountPaid) - cartTotal || 0
    };

    onSendToKitchen(order);
    setCart([]);
    setShowPayment(false);
    setPaymentMethod('');
    setAmountPaid('');
  };

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Fiscal</title>
          <style>
            .thermal-receipt {
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              padding: 5mm;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .separator { border-top: 1px dashed #000; margin: 5px 0; }
            @media print {
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="thermal-receipt">
            <div class="center">
              <strong>RESTAURANTE EXEMPLO</strong><br>
              CNPJ: 00.000.000/0001-00<br>
              Rua Exemplo, 123<br>
              Tel: (11) 99999-9999<br>
            </div>
            <div class="separator"></div>
            <div>Pedido: ${order.id}</div>
            <div>Data: ${order.timestamp.toLocaleString('pt-BR')}</div>
            <div class="separator"></div>
            ${order.items.map(item => 
              `<div>${item.quantity}x ${item.name}<br>
               <div class="right">R$ ${(item.price * item.quantity).toFixed(2)}</div></div>`
            ).join('')}
            <div class="separator"></div>
            <div class="right">
              <strong>TOTAL: R$ ${order.total.toFixed(2)}</strong><br>
              Pagamento: ${order.paymentMethod}<br>
              ${order.amountPaid ? `Recebido: R$ ${order.amountPaid.toFixed(2)}<br>` : ''}
              ${order.change && order.change > 0 ? `Troco: R$ ${order.change.toFixed(2)}<br>` : ''}
            </div>
            <div class="separator"></div>
            <div class="center">
              Obrigado pela preferência!<br>
              Volte sempre!
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  if (showPayment) {
    const change = parseFloat(amountPaid) - cartTotal;
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Finalizar Venda</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {cartTotal.toFixed(2)}
                </div>
                <p className="text-gray-600">Total da Venda</p>
              </div>

              <div className="space-y-3">
                <p className="font-medium">Forma de Pagamento:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dinheiro', name: 'Dinheiro', icon: Banknote },
                    { id: 'pix', name: 'PIX', icon: Smartphone },
                    { id: 'cartao', name: 'Cartão', icon: CreditCard }
                  ].map(method => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      className="h-16 flex-col space-y-1 touch-button"
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <method.icon className="w-4 h-4" />
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'dinheiro' && (
                <div className="space-y-2">
                  <label className="font-medium">Valor Recebido:</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="text-center text-lg h-12"
                  />
                  
                  {parseFloat(amountPaid) > cartTotal && (
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-green-600 font-medium">
                        Troco: R$ {change.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 touch-button"
                  onClick={() => setShowPayment(false)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 touch-button"
                  onClick={handleFinalizeSale}
                  disabled={!paymentMethod || (paymentMethod === 'dinheiro' && parseFloat(amountPaid) < cartTotal)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack} className="touch-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Terminal PDV</h1>
          </div>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 p-4 desktop-grid mobile-grid">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="whitespace-nowrap touch-button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => addToCart(product)}
                      className="touch-button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Carrinho</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <span className="font-bold text-green-600">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {cartTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 touch-button"
                      onClick={handleSendToKitchen}
                      disabled={cart.length === 0}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Cozinha
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDVTerminal;
