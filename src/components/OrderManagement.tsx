
import React from 'react';
import { useOrderManagement } from '@/hooks/useOrderManagement';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderManagementProps {
  cart: CartItem[];
  onClearCart: () => void;
  tableId?: string;
  orderType?: 'table' | 'takeaway';
}

const OrderManagement: React.FC<OrderManagementProps> = ({ cart, onClearCart, tableId, orderType }) => {
  const { orders, sendToKitchen, loading } = useOrderManagement({ 
    cart, 
    onClearCart,
    tableId,
    orderType
  });

  return {
    orders,
    sendToKitchen,
    loading
  };
};

export default OrderManagement;
