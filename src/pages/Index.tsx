
import React, { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import TerminalSelector from '@/components/TerminalSelector';
import PDVTerminal from '@/components/PDVTerminal';
import KitchenTerminal from '@/components/KitchenTerminal';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTerminal, setCurrentTerminal] = useState<'selector' | 'pdv' | 'kitchen'>('selector');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulação de login - em produção, integrar com Supabase Auth
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validação simples para demonstração
      if (email && password) {
        setIsAuthenticated(true);
        setCurrentTerminal('selector');
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Sistema PDV & Cozinha - Pastel Neto",
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

  const handleSendToKitchen = (order: any) => {
    toast({
      title: "Pedido enviado para a cozinha!",
      description: `Pedido enviado com sucesso`,
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: any) => {
    const statusMessages = {
      'preparing': 'Pedido em preparo',
      'ready': 'Pedido pronto para entrega',
      'delivered': 'Pedido entregue com sucesso'
    };

    toast({
      title: statusMessages[status] || 'Status atualizado',
      description: `Pedido atualizado`,
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
          orders={[]}
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
