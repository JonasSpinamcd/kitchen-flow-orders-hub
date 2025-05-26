
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CashMovement {
  id: string;
  type: 'open' | 'close' | 'sale' | 'withdrawal';
  amount: number;
  description?: string;
  payment_method?: string;
  order_id?: string;
  created_at: string;
}

const CashManagement: React.FC = () => {
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCashMovements();
  }, []);

  const fetchCashMovements = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCashMovements(data || []);
      
      // Calcular total do caixa
      const total = (data || []).reduce((sum, movement) => {
        if (movement.type === 'sale' || movement.type === 'open') {
          return sum + movement.amount;
        } else if (movement.type === 'withdrawal') {
          return sum - movement.amount;
        }
        return sum;
      }, 0);
      
      setTotalCash(total);
      
      // Verificar se o caixa está aberto
      const hasOpenMovement = (data || []).some(movement => movement.type === 'open');
      const hasCloseMovement = (data || []).some(movement => movement.type === 'close');
      setIsOpen(hasOpenMovement && !hasCloseMovement);
      
    } catch (error) {
      console.error('Erro ao buscar movimentações do caixa:', error);
    }
  };

  const openCash = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cash_movements')
        .insert({
          type: 'open',
          amount: 0,
          description: 'Abertura do caixa'
        });

      if (error) throw error;

      toast({
        title: "Caixa aberto",
        description: "Caixa aberto com sucesso!",
      });

      fetchCashMovements();
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir o caixa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeCash = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cash_movements')
        .insert({
          type: 'close',
          amount: totalCash,
          description: `Fechamento do caixa - Total: R$ ${totalCash.toFixed(2)}`
        });

      if (error) throw error;

      toast({
        title: "Caixa fechado",
        description: `Caixa fechado. Total: R$ ${totalCash.toFixed(2)}`,
      });

      // Imprimir relatório de fechamento
      printCloseReport();
      
      fetchCashMovements();
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar o caixa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const printCloseReport = () => {
    const printContent = `
      PASTEL NETO - FECHAMENTO DE CAIXA
      ${new Date().toLocaleString('pt-BR')}
      ================================
      
      TOTAL EM CAIXA: R$ ${totalCash.toFixed(2)}
      
      MOVIMENTAÇÕES DO DIA:
      ${cashMovements.map(movement => 
        `${movement.type.toUpperCase()}: R$ ${movement.amount.toFixed(2)} - ${movement.description || ''}`
      ).join('\n      ')}
      
      ================================
      Sistema PDV - Pastel Neto
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Fechamento</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Gestão de Caixa
          </span>
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total em Caixa</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalCash.toFixed(2)}</p>
        </div>

        <div className="flex gap-2">
          {!isOpen ? (
            <Button
              onClick={openCash}
              disabled={loading}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Abrir Caixa
            </Button>
          ) : (
            <Button
              onClick={closeCash}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Fechar Caixa
            </Button>
          )}
          
          <Button
            onClick={printCloseReport}
            variant="outline"
            size="icon"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>

        {cashMovements.length > 0 && (
          <div className="max-h-32 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Últimas Movimentações:</p>
            {cashMovements.slice(0, 5).map((movement) => (
              <div key={movement.id} className="text-xs flex justify-between py-1 border-b">
                <span>{movement.description}</span>
                <span className={movement.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                  {movement.type === 'withdrawal' ? '-' : '+'}R$ {movement.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CashManagement;
