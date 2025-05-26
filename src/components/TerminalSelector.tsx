
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ChefHat, LogOut } from 'lucide-react';

interface TerminalSelectorProps {
  onSelectTerminal: (terminal: 'pdv' | 'kitchen') => void;
  onLogout: () => void;
}

const TerminalSelector: React.FC<TerminalSelectorProps> = ({ onSelectTerminal, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Sistema PDV & Cozinha
          </h1>
          <p className="text-gray-600">Selecione o terminal que deseja acessar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl border-0 bg-white/90 backdrop-blur-sm"
            onClick={() => onSelectTerminal('pdv')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 gradient-pdv rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-blue-600">Terminal de Pedidos</CardTitle>
              <p className="text-gray-600 text-sm">PDV - Ponto de Venda</p>
            </CardHeader>
            
            <CardContent className="text-center">
              <Button 
                className="w-full h-12 text-base font-semibold gradient-pdv hover:opacity-90 touch-button"
                onClick={() => onSelectTerminal('pdv')}
              >
                Entrar no PDV
              </Button>
              
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>• Gerenciar pedidos</p>
                <p>• Processar vendas</p>
                <p>• Fechar caixa</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl border-0 bg-white/90 backdrop-blur-sm"
            onClick={() => onSelectTerminal('kitchen')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 gradient-kitchen rounded-full flex items-center justify-center mb-4">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-orange-600">Terminal da Cozinha</CardTitle>
              <p className="text-gray-600 text-sm">Acompanhamento de Pedidos</p>
            </CardHeader>
            
            <CardContent className="text-center">
              <Button 
                className="w-full h-12 text-base font-semibold gradient-kitchen hover:opacity-90 touch-button"
                onClick={() => onSelectTerminal('kitchen')}
              >
                Entrar na Cozinha
              </Button>
              
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>• Receber pedidos</p>
                <p>• Controlar preparo</p>
                <p>• Finalizar entregas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={onLogout}
            className="touch-button border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TerminalSelector;
