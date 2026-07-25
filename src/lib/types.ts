// ==================== SETTINGS ====================
export interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  taxPercentage: number;
  currency: string;
  currencySymbol: string;
  invoiceFooter: string;
  logo: string;
}

// ==================== CATEGORIES ====================
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

// ==================== PRODUCTS ====================
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  categoryId?: string;
  image?: string;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

// ==================== CUSTOMERS ====================
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== STAFF ====================
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'cashier' | 'manager';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== ORDERS ====================
export type PaymentMethod = 'cash' | 'card' | 'online';
export type OrderStatus = 'completed' | 'cancelled' | 'refunded';

export interface OrderItemData {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  costPrice?: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  staffId?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  staff?: Pick<Staff, 'id' | 'name' | 'role'>;
  items: OrderItemData[];
}

// ==================== INVENTORY ====================
export interface InventoryLog {
  id: string;
  productId: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name'>;
}

// ==================== EXPENSES ====================
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  yearlySales: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  orders: number;
}

// ==================== REPORTS ====================
export interface ReportData {
  totalSales: number;
  totalProfit: number;
  totalTax: number;
  orderCount: number;
  orders: Order[];
}

// ==================== CART ====================
export interface CartItem {
  product: Product;
  quantity: number;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
