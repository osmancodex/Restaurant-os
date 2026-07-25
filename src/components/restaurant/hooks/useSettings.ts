import { useQuery } from '@tanstack/react-query';
import type { RestaurantSettings } from '@/lib/types';

const defaultSettings: RestaurantSettings = {
  restaurantName: 'My Restaurant',
  address: '123 Main Street, City',
  phone: '+1 234 567 890',
  taxPercentage: 10,
  currency: 'USD',
  currencySymbol: '$',
  invoiceFooter: 'Thank you for dining with us!',
  logo: '',
};

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<RestaurantSettings> => {
      const res = await fetch('/api/settings');
      const { data } = await res.json();
      return {
        ...defaultSettings,
        ...data,
        taxPercentage: parseFloat(data?.taxPercentage || '10'),
      };
    },
    staleTime: 30000,
  });
}

export function useCurrencyFormatter() {
  const { data: settings } = useSettings();
  const symbol = settings?.currencySymbol || '$';
  return (amount: number) => `${symbol}${amount.toFixed(2)}`;
}
