
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Printer, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface CheckoutDialogProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onComplete: () => void;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({ cart, total, onClose, onComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const change = paymentMethod === 'dinheiro' ? Math.max(0, parseFloat(amountPaid) - total) : 0;

  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `VEN${timestamp}`;
  };

  const handleFinalizeSale = async () => {
    if (paymentMethod === 'dinheiro' && parseFloat(amountPaid) < total) {
      toast({
        title: "Valor insuficiente",
        description: "O valor pago deve ser maior ou igual ao total.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const orderNumber = generateOrderNumber();
      const paidAmount = paymentMethod === 'dinheiro' ? parseFloat(amountPaid) : total;

      // Criar o pedido finalizado
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          total: total,
          status: 'delivered',
          payment_method: paymentMethod,
          amount_paid: paidAmount,
          change_amount: change
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar os itens do pedido
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Gerar comprovante
      generateReceipt(order, cart, paymentMethod, paidAmount, change);

      toast({
        title: "Venda finalizada!",
        description: `Venda ${orderNumber} finalizada com sucesso.`,
      });

      onComplete();

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar a venda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = (order: any, items: CartItem[], method: string, paid: number, changeAmount: number) => {
    const receiptWindow = window.open('', '_blank');
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante - ${order.order_number}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { width: 80mm; }
            }
            .thermal-receipt {
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              padding: 10px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .item-line { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body class="thermal-receipt">
          <div class="center bold">
            PASTEL NETO<br>
            COMPROVANTE DE VENDA
          </div>
          
          <div class="separator"></div>
          
          <div>
            <strong>Pedido:</strong> ${order.order_number}<br>
            <strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}<br>
          </div>
          
          <div class="separator"></div>
          
          ${items.map(item => `
            <div class="item-line">
              <span>${item.quantity}x ${item.name}</span>
              <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="item-line bold">
            <span>TOTAL:</span>
            <span>R$ ${total.toFixed(2)}</span>
          </div>
          
          <div>
            <strong>Pagamento:</strong> ${method.toUpperCase()}<br>
            ${method === 'dinheiro' ? `
              <strong>Valor Pago:</strong> R$ ${paid.toFixed(2)}<br>
              <strong>Troco:</strong> R$ ${changeAmount.toFixed(2)}<br>
            ` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="center">
            Obrigado pela preferência!<br>
            Volte sempre!
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `;
    
    if (receiptWindow) {
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <Label className="text-base font-semibold">Forma de Pagamento</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value: 'dinheiro' | 'pix' | 'cartao') => setPaymentMethod(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dinheiro" id="dinheiro" />
                <Label htmlFor="dinheiro" className="flex items-center cursor-pointer">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Dinheiro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex items-center cursor-pointer">
                  <Smartphone className="w-4 h-4 mr-2" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cartao" id="cartao" />
                <Label htmlFor="cartao" className="flex items-center cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cartão
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Valor pago (apenas para dinheiro) */}
          {paymentMethod === 'dinheiro' && (
            <div>
              <Label htmlFor="amountPaid">Valor Recebido</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0,00"
                className="mt-1"
              />
              {amountPaid && (
                <div className="mt-2 p-2 bg-green-50 rounded text-green-700">
                  <strong>Troco: R$ {change.toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleFinalizeSale}
              disabled={loading || (paymentMethod === 'dinheiro' && (!amountPaid || parseFloat(amountPaid) < total))}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              {loading ? 'Finalizando...' : 'Finalizar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
