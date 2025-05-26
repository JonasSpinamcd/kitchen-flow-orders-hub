
import React, { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import TerminalSelector from '@/components/TerminalSelector';
import PDVTerminal from '@/components/PDVTerminal';
import KitchenTerminal from '@/components/KitchenTerminal';
import { useToast } from '@/hooks/use-toast';

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

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTerminal, setCurrentTerminal] = useState<'selector' | 'pdv' | 'kitchen'>('selector');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulação de login - em produção, integrar com Supabase
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validação simples para demonstração
      if (email && password) {
        setIsAuthenticated(true);
        setCurrentTerminal('selector');
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Sistema PDV & Cozinha",
        });
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTerminal('selector');
    setOrders([]);
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleSelectTerminal = (terminal: 'pdv' | 'kitchen') => {
    setCurrentTerminal(terminal);
    toast({
      title: `Terminal ${terminal === 'pdv' ? 'PDV' : 'Cozinha'} ativado`,
      description: `Você está agora no terminal ${terminal === 'pdv' ? 'de vendas' : 'da cozinha'}`,
    });
  };

  const handleSendToKitchen = (order: Order) => {
    const newOrder: Order = {
      ...order,
      status: 'received'
    };
    
    setOrders(prev => [...prev, newOrder]);
    
    toast({
      title: "Pedido enviado para a cozinha!",
      description: `Pedido #${order.id} enviado com sucesso`,
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status }
          : order
      )
    );

    const statusMessages = {
      'preparing': 'Pedido em preparo',
      'ready': 'Pedido pronto para entrega',
      'delivered': 'Pedido entregue com sucesso'
    };

    toast({
      title: statusMessages[status] || 'Status atualizado',
      description: `Pedido #${orderId} atualizado`,
    });
  };

  const handleBackToSelector = () => {
    setCurrentTerminal('selector');
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} isLoading={isLoading} />;
  }

  switch (currentTerminal) {
    case 'pdv':
      return (
        <PDVTerminal 
          onBack={handleBackToSelector}
          onSendToKitchen={handleSendToKitchen}
        />
      );
    
    case 'kitchen':
      return (
        <KitchenTerminal 
          onBack={handleBackToSelector}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      );
    
    default:
      return (
        <TerminalSelector 
          onSelectTerminal={handleSelectTerminal}
          onLogout={handleLogout}
        />
      );
  }
};

export default Index;
