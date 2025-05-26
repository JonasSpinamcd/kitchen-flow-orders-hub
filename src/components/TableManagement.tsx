
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus } from 'lucide-react';

interface Table {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved';
  created_at: string;
}

interface TableManagementProps {
  onSelectTable: (tableId: string, tableNumber: number) => void;
  selectedTableId?: string;
}

const TableManagement: React.FC<TableManagementProps> = ({ onSelectTable, selectedTableId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
    subscribeToTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTables = () => {
    const channel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables'
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return <div className="text-center">Carregando mesas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Comandas por Mesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tables.map((table) => (
            <Button
              key={table.id}
              variant={selectedTableId === table.id ? "default" : "outline"}
              onClick={() => onSelectTable(table.id, table.table_number)}
              className="h-20 flex flex-col items-center justify-center relative"
            >
              <span className="text-lg font-bold">Mesa {table.table_number}</span>
              <Badge 
                className={`${getStatusColor(table.status)} text-white text-xs mt-1`}
              >
                {getStatusText(table.status)}
              </Badge>
            </Button>
          ))}
          
          <Button
            variant="dashed"
            className="h-20 flex flex-col items-center justify-center border-2 border-dashed"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-sm">Balcão</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TableManagement;
