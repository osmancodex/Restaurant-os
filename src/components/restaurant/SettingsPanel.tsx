'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Building2,
  Receipt,
  Database,
  Upload,
  Download,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

type SettingsMap = Record<string, string>;

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD - US Dollar' },
  { value: 'EUR', symbol: '€', label: 'EUR - Euro' },
  { value: 'GBP', symbol: '£', label: 'GBP - British Pound' },
  { value: 'PKR', symbol: '₨', label: 'PKR - Pakistani Rupee' },
  { value: 'INR', symbol: '₹', label: 'INR - Indian Rupee' },
  { value: 'AED', symbol: 'د.إ', label: 'AED - UAE Dirham' },
  { value: 'SAR', symbol: '﷼', label: 'SAR - Saudi Riyal' },
  { value: 'CAD', symbol: 'C$', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', symbol: 'A$', label: 'AUD - Australian Dollar' },
  { value: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen' },
  { value: 'CNY', symbol: '¥', label: 'CNY - Chinese Yuan' },
  { value: 'TRY', symbol: '₺', label: 'TRY - Turkish Lira' },
  { value: 'BRL', symbol: 'R$', label: 'BRL - Brazilian Real' },
  { value: 'MXN', symbol: 'Mex$', label: 'MXN - Mexican Peso' },
];

export default function SettingsPanel() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings
  const {
    data: settings = {},
    isLoading: settingsLoading,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SettingsMap;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: SettingsMap) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  // Local form state derived from settings
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    logo: '',
  });
  const [taxCurrency, setTaxCurrency] = useState({
    taxPercentage: '',
    currency: 'USD',
    currencySymbol: '$',
  });
  const [invoiceFooter, setInvoiceFooter] = useState('');

  // Sync local state from query data
  useEffect(() => {
    setRestaurantInfo({
      restaurantName: settings.restaurantName || '',
      address: settings.address || '',
      phone: settings.phone || '',
      logo: settings.logo || '',
    });
    setTaxCurrency({
      taxPercentage: settings.taxPercentage || '',
      currency: settings.currency || 'USD',
      currencySymbol: settings.currencySymbol || '$',
    });
    setInvoiceFooter(settings.invoiceFooter || '');
  }, [settings]);

  function saveRestaurantInfo(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(restaurantInfo);
  }

  function saveTaxCurrency(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(taxCurrency);
  }

  function saveInvoiceFooter(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ invoiceFooter });
  }

  // Logo upload handler
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      toast.error('Logo file must be under 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setRestaurantInfo((prev) => ({ ...prev, logo: base64 }));
      updateMutation.mutate({ logo: base64 });
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setRestaurantInfo((prev) => ({ ...prev, logo: '' }));
    updateMutation.mutate({ logo: '' });
  }

  // Currency change handler
  function handleCurrencyChange(value: string) {
    const currency = CURRENCIES.find((c) => c.value === value);
    setTaxCurrency((prev) => ({
      ...prev,
      currency: value,
      currencySymbol: currency?.symbol || '$',
    }));
  }

  // Backup export
  async function handleExport() {
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurant-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }

  // Backup restore
  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Restore failed');
      }

      toast.success('Database restored successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid backup file');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="restaurant" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-4">
          <TabsTrigger value="restaurant" className="text-xs sm:text-sm">
            <Building2 className="h-4 w-4 mr-1 hidden sm:inline" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm">
            <Receipt className="h-4 w-4 mr-1 hidden sm:inline" />
            Tax & Currency
          </TabsTrigger>
          <TabsTrigger value="invoice" className="text-xs sm:text-sm">
            <Receipt className="h-4 w-4 mr-1 hidden sm:inline" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-xs sm:text-sm">
            <Database className="h-4 w-4 mr-1 hidden sm:inline" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Restaurant Info Tab */}
        <TabsContent value="restaurant">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restaurant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveRestaurantInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="res-name">Restaurant Name</Label>
                    <Input
                      id="res-name"
                      value={restaurantInfo.restaurantName}
                      onChange={(e) =>
                        setRestaurantInfo((prev) => ({
                          ...prev,
                          restaurantName: e.target.value,
                        }))
                      }
                      placeholder="My Restaurant"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="res-address">Address</Label>
                    <Input
                      id="res-address"
                      value={restaurantInfo.address}
                      onChange={(e) =>
                        setRestaurantInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="123 Main Street, City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="res-phone">Phone</Label>
                    <Input
                      id="res-phone"
                      value={restaurantInfo.phone}
                      onChange={(e) =>
                        setRestaurantInfo((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                {/* Logo Section */}
                <div className="space-y-3">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {restaurantInfo.logo ? (
                      <div className="relative h-20 w-20 rounded-lg border overflow-hidden bg-muted/50">
                        <img
                          src={restaurantInfo.logo}
                          alt="Logo"
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      {restaurantInfo.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={removeLogo}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or SVG. Max 500KB.
                  </p>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    size="sm"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax & Currency Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax & Currency Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveTaxCurrency} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Percentage (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxCurrency.taxPercentage}
                      onChange={(e) =>
                        setTaxCurrency((prev) => ({
                          ...prev,
                          taxPercentage: e.target.value,
                        }))
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={taxCurrency.currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency-symbol">Currency Symbol</Label>
                    <Input
                      id="currency-symbol"
                      value={taxCurrency.currencySymbol}
                      onChange={(e) =>
                        setTaxCurrency((prev) => ({
                          ...prev,
                          currencySymbol: e.target.value,
                        }))
                      }
                      placeholder="$"
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    size="sm"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Footer Tab */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveInvoiceFooter} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-footer">Invoice Footer Text</Label>
                  <Textarea
                    id="invoice-footer"
                    rows={5}
                    value={invoiceFooter}
                    onChange={(e) => setInvoiceFooter(e.target.value)}
                    placeholder="Thank you for dining with us!&#10;Visit us again soon."
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    This text will appear at the bottom of printed invoices and receipts.
                  </p>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    size="sm"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">Export Database</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download a complete backup of all your restaurant data as a JSON file.
                    Settings are not included as they can be re-seeded.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Backup
                </Button>
              </div>

              <Separator />

              {/* Restore */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">Restore Database</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Restore data from a previously exported JSON backup file.
                    <span className="text-destructive font-medium">
                      {' '}Warning: This will replace ALL existing data!
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestore}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
