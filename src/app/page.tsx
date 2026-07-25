'use client';

import { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import LoginPage from '@/components/restaurant/LoginPage';
import DashboardPage from '@/components/restaurant/DashboardPage';
import POSPage from '@/components/restaurant/POSPage';
import OrderHistory from '@/components/restaurant/OrderHistory';
import ProductManagement from '@/components/restaurant/ProductManagement';
import CategoryManagement from '@/components/restaurant/CategoryManagement';
import InventoryManagement from '@/components/restaurant/InventoryManagement';
import ExpenseManagement from '@/components/restaurant/ExpenseManagement';
import CustomerManagement from '@/components/restaurant/CustomerManagement';
import StaffManagement from '@/components/restaurant/StaffManagement';
import SettingsPanel from '@/components/restaurant/SettingsPanel';
import ReportsPage from '@/components/restaurant/ReportsPage';
import { useAuth } from '@/components/restaurant/hooks/useAuth';
import { useSettings } from '@/components/restaurant/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Tags,
  Warehouse,
  DollarSign,
  Users,
  UserCog,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  UtensilsCrossed,
  FileBarChart,
} from 'lucide-react';
import type { Staff } from '@/lib/types';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: 1 } },
});

type Page =
  | 'dashboard' | 'pos' | 'orders' | 'products' | 'categories'
  | 'inventory' | 'expenses' | 'customers' | 'staff' | 'settings' | 'reports';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
  { id: 'pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { id: 'orders', label: 'Orders', icon: ClipboardList, roles: ['admin', 'manager', 'cashier'] },
  { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'manager'] },
  { id: 'categories', label: 'Categories', icon: Tags, roles: ['admin', 'manager'] },
  { id: 'inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'manager'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, roles: ['admin', 'manager'] },
  { id: 'reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'manager'] },
  { id: 'staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const { staff, login, logout, isAuthenticated, hasRole } = useAuth();
  const { data: settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' })
      .finally(() => setSeeding(false));
  }, []);

  const visibleNavItems = useMemo(() => {
    if (!staff) return navItems.filter(n => n.roles.includes('cashier'));
    return navItems.filter(n => hasRole(n.roles));
  }, [staff, hasRole]);

  function handleLogin(loggedInStaff: Staff) {
    const firstPage = hasRole(['admin']) ? 'dashboard' : 'pos';
    setCurrentPage(firstPage);
  }

  function handlePageChange(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
  }

  if (!isAuthenticated() || !staff) {
    if (seeding) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <UtensilsCrossed className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Initializing system...</p>
          </div>
        </div>
      );
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'pos': return <POSPage />;
      case 'orders': return <OrderHistory />;
      case 'products': return <ProductManagement />;
      case 'categories': return <CategoryManagement />;
      case 'inventory': return <InventoryManagement />;
      case 'expenses': return <ExpenseManagement />;
      case 'customers': return <CustomerManagement />;
      case 'staff': return <StaffManagement />;
      case 'settings': return <SettingsPanel />;
      case 'reports': return <ReportsPage />;
      default: return <DashboardPage />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between h-14 px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              {settings?.logo ? (
                <img src={settings.logo} alt="" className="h-7 w-7 rounded object-cover" />
              ) : (
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              )}
              <span className="font-semibold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">
                {settings?.restaurantName || 'RestaurantOS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => handlePageChange(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {staff.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {staff.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{staff.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{staff.email}</p>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{staff.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePageChange('dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePageChange('settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-14 bottom-0 w-64 bg-background border-r overflow-y-auto">
            <nav className="p-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handlePageChange(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl">
          {renderPage()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur mt-auto">
        <div className="flex h-10 items-center justify-center px-4">
          <p className="text-xs text-muted-foreground">
            RestaurantOS &copy; {new Date().getFullYear()} — {settings?.restaurantName || 'My Restaurant'}
          </p>
        </div>
      </footer>
    </div>
  );
}
