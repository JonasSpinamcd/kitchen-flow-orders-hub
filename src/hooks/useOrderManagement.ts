
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  order_number: string;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  payment_method?: string;
  amount_paid?: number;
  change_amount?: number;
  created_at: string;
  table_id?: string;
  order_type?: string;
  order_items?: OrderItem[];
}

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

interface UseOrderManagementProps {
  cart: CartItem[];
  onClearCart: () => void;
  tableId?: string;
  orderType?: 'table' | 'takeaway';
}

export const useOrderManagement = ({ cart, onClearCart, tableId, orderType = 'table' }: UseOrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedOrders = (data || []).map(order => ({
        ...order,
        status: order.status as 'received' | 'preparing' | 'ready' | 'delivered'
      }));
      
      setOrders(typedOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('orders-changes')
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

  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `PED${timestamp}`;
  };

  const sendToKitchen = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de enviar para a cozinha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderNumber = generateOrderNumber();

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          total: total,
          status: 'received',
          table_id: tableId,
          order_type: orderType
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

      // Atualizar status da mesa se for pedido de mesa
      if (tableId && orderType === 'table') {
        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', tableId);
      }

      toast({
        title: "Pedido enviado!",
        description: `Pedido ${orderNumber} enviado para a cozinha com sucesso.`,
      });

      onClearCart();
      
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar pedido para a cozinha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    sendToKitchen,
    loading
  };
};
