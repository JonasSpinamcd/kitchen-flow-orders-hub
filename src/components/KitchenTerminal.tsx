
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  created_at: string;
  order_items: OrderItem[];
}

interface KitchenTerminalProps {
  onBack: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const KitchenTerminal: React.FC<KitchenTerminalProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name)
          )
        `)
        .in('status', ['received', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages = {
        'preparing': 'Pedido em preparo',
        'ready': 'Pedido pronto para entrega',
        'delivered': 'Pedido entregue com sucesso'
      };

      toast({
        title: statusMessages[newStatus] || 'Status atualizado',
        description: `Pedido atualizado com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      'received': { 
        color: 'bg-blue-100 text-blue-800', 
        icon: AlertCircle, 
        label: 'Recebido' 
      },
      'preparing': { 
        color: 'bg-orange-100 text-orange-800', 
        icon: Clock, 
        label: 'Preparando' 
      },
      'ready': { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Pronto' 
      },
      'delivered': { 
        color: 'bg-gray-100 text-gray-800', 
        icon: Package, 
        label: 'Entregue' 
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow = {
      'received': 'preparing' as const,
      'preparing': 'ready' as const,
      'ready': 'delivered' as const,
      'delivered': null
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: Order['status']): string => {
    const labels = {
      'received': 'Iniciar Preparo',
      'preparing': 'Marcar como Pronto',
      'ready': 'Marcar como Entregue'
    };
    return labels[currentStatus] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Carregando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-kitchen text-white p-4 shadow-lg">
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
            <h1 className="text-2xl font-bold">Terminal da Cozinha - Pastel Neto</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-3 py-2 rounded-lg">
              <span className="font-semibold">{orders.length} pedidos ativos</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum pedido ativo
            </h2>
            <p className="text-gray-500">
              Os novos pedidos aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              
              return (
                <Card key={order.id} className="order-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Pedido {order.order_number}
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getTimeElapsed(order.created_at)} atrás
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Itens do pedido */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Itens:</h4>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{item.quantity}x {item.products.name}</span>
                          <span className="font-medium">R$ {item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-green-600">
                        R$ {order.total.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Botão de ação */}
                    {nextStatus && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        className="w-full touch-button"
                        variant={order.status === 'ready' ? 'default' : 'outline'}
                      >
                        {getNextStatusLabel(order.status)}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenTerminal;
