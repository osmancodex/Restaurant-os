'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryLog, Product } from '@/lib/types';

export function useInventoryLogs() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as (InventoryLog & { product?: Pick<Product, 'id' | 'name'> })[];
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['lowStock'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/low-stock');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as (Product & { category?: Pick<Product['category'], 'name'> })[];
    },
  });
}

export interface AdjustStockInput {
  productId: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  supplier?: string;
  notes?: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdjustStockInput) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
    },
  });
}
