
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  AlertCircle,
  Package
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  paymentMethod?: string;
  amountPaid?: number;
  change?: number;
}

interface KitchenTerminalProps {
  onBack: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const KitchenTerminal: React.FC<KitchenTerminalProps> = ({ 
  onBack, 
  orders, 
  onUpdateOrderStatus 
}) => {
  const [selectedFilter, setSelectedFilter] = useState<Order['status'] | 'all'>('all');

  const filteredOrders = selectedFilter === 'all' 
    ? orders.filter(order => order.status !== 'delivered')
    : orders.filter(order => order.status === selectedFilter);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'received': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'received': return AlertCircle;
      case 'preparing': return Clock;
      case 'ready': return CheckCircle;
      case 'delivered': return Package;
      default: return AlertCircle;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'received': return 'Recebido';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      default: return 'Desconhecido';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'received': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus: Order['status']): string => {
    switch (currentStatus) {
      case 'received': return 'Iniciar Preparo';
      case 'preparing': return 'Marcar como Pronto';
      case 'ready': return 'Pedido Entregue';
      default: return '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getElapsedTime = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack} className="touch-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <ChefHat className="w-6 h-6 text-orange-600" />
              <span>Terminal da Cozinha</span>
            </h1>
          </div>
          
          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
            {filteredOrders.length} pedidos ativos
          </Badge>
        </div>

        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {[
            { id: 'all', name: 'Todos', count: orders.filter(o => o.status !== 'delivered').length },
            { id: 'received', name: 'Recebidos', count: orders.filter(o => o.status === 'received').length },
            { id: 'preparing', name: 'Preparando', count: orders.filter(o => o.status === 'preparing').length },
            { id: 'ready', name: 'Prontos', count: orders.filter(o => o.status === 'ready').length }
          ].map(filter => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              className="whitespace-nowrap touch-button"
              onClick={() => setSelectedFilter(filter.id as any)}
            >
              {filter.name} ({filter.count})
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500">Os novos pedidos aparecerão aqui automaticamente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders
              .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
              .map(order => {
                const StatusIcon = getStatusIcon(order.status);
                const nextStatus = getNextStatus(order.status);
                const isPulsing = order.status === 'received';
                
                return (
                  <Card 
                    key={order.id} 
                    className={`transition-all duration-200 hover:shadow-lg ${
                      isPulsing ? 'order-pulse' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatTime(order.timestamp)}</span>
                        <span className="font-medium">{getElapsedTime(order.timestamp)}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${item.id}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{item.quantity}x {item.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-green-600">
                            R$ {order.total.toFixed(2)}
                          </span>
                        </div>
                        
                        {nextStatus && (
                          <Button
                            className={`w-full touch-button ${
                              order.status === 'received' 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : order.status === 'preparing'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                            onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
                          >
                            {getNextStatusText(order.status)}
                          </Button>
                        )}
                      </div>
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
