import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { ChangePasswordModal } from './components/common/Modals';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { ProductsView } from './components/products/ProductsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { SupplierPaymentsView } from './components/suppliers/SupplierPaymentsView';
import { ClientsView } from './components/clients/ClientsView';
import { DocumentsListView } from './components/documents/DocumentsListView';
import { ReportsView } from './components/reports/ReportsView';
import { DeveloperPanelView } from './components/developer/DeveloperPanelView';
import { SettingsView } from './components/settings/SettingsView';
import { api } from './services/api';
import { Product, DocumentTemplate } from './types';
import { ShieldAlert, RefreshCw, LayoutDashboard, ShoppingCart, Boxes, FileSpreadsheet, Menu } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading, hasAccess, settings } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stockFilterParam, setStockFilterParam] = useState<string>('all');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const loadStockCounts = async () => {
    try {
      const [prods, tpls] = await Promise.all([
        api.getProducts(),
        api.getDocumentTemplates().catch(() => []),
      ]);
      setProducts(prods);
      setTemplates(tpls);
    } catch (err) {
      console.warn('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadStockCounts();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center space-x-3 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <span>Chargement de CarrelageArwa...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.stockMin && p.stockQuantity > 0).length;

  const handleNavigate = (tab: string, filter?: string) => {
    if (filter) setStockFilterParam(filter);
    setCurrentTab(tab);
  };

  // Determine page title
  const titles: Record<string, string> = {
    dashboard: 'Tableau de Bord',
    pos: 'Point de Vente & Caisse',
    products: 'Catalogue Produits & Carrelage',
    categories: 'Catégories',
    inventory: 'Inventaire & Mouvements',
    purchases: 'Achats Fournisseurs',
    suppliers: 'Fournisseurs',
    supplierPayments: 'Paiements Fournisseurs',
    clients: 'Clients & Soldes',
    invoices: 'Factures Commerciales',
    deliveryNotes: 'Bons de Livraison',
    reports: 'Rapports & Rentabilité',
    settings: 'Paramètres du Magasin',
    developer: 'Developer Panel — Configuration Système',
  };

  // Check section access permission
  const isAuthorized = hasAccess(currentTab as any);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar Navigation (Permanent on Desktop, Drawer on Mobile/Tablet) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        outOfStockCount={outOfStockCount}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          pageTitle={titles[currentTab] || 'Carrelage Arwa'}
          lowStockCount={lowStockCount}
          outOfStockCount={outOfStockCount}
          onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
          onNavigateToStockAlerts={() => handleNavigate('inventory', 'low')}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {!isAuthorized ? (
            <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-2xl border border-rose-200 shadow-md space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Accès Révoqué par le Développeur</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cette section de l'application a été désactivée pour votre profil par le Développeur. Veuillez contacter l'administrateur système pour toute demande d'accès.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Retour au Tableau de Bord
              </button>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  onNavigateToTab={handleNavigate}
                  currency={settings?.currency || 'DH'}
                />
              )}

              {currentTab === 'pos' && (
                <PosView
                  settings={settings || ({} as any)}
                  templates={templates}
                  onSaleCompleted={loadStockCounts}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  settings={settings || ({} as any)}
                  initialFilter={stockFilterParam}
                />
              )}

              {currentTab === 'categories' && <CategoriesView />}

              {currentTab === 'inventory' && (
                <InventoryView
                  settings={settings || ({} as any)}
                  initialFilter={stockFilterParam}
                />
              )}

              {currentTab === 'purchases' && (
                <PurchasesView settings={settings || ({} as any)} />
              )}

              {currentTab === 'suppliers' && (
                <SuppliersView
                  settings={settings || ({} as any)}
                  onNavigateToPayments={() => setCurrentTab('supplierPayments')}
                />
              )}

              {currentTab === 'supplierPayments' && (
                <SupplierPaymentsView settings={settings || ({} as any)} />
              )}

              {currentTab === 'clients' && (
                <ClientsView settings={settings || ({} as any)} />
              )}

              {currentTab === 'invoices' && (
                <DocumentsListView
                  type="facture"
                  settings={settings || ({} as any)}
                  templates={templates}
                />
              )}

              {currentTab === 'deliveryNotes' && (
                <DocumentsListView
                  type="bon_livraison"
                  settings={settings || ({} as any)}
                  templates={templates}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView settings={settings || ({} as any)} />
              )}

              {currentTab === 'settings' && (
                <SettingsView onNavigateToDeveloper={() => setCurrentTab('developer')} />
              )}

              {currentTab === 'developer' && user.role === 'developer' && (
                <DeveloperPanelView />
              )}
            </>
          )}
        </main>

        {/* Mobile & Tablet Quick Bottom Navigation Bar */}
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shrink-0 z-20 text-slate-400 shadow-lg">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              currentTab === 'dashboard' ? 'text-amber-400 font-bold' : 'hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Tableau</span>
          </button>

          <button
            onClick={() => handleNavigate('pos')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all -mt-3 shadow-md ${
              currentTab === 'pos'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                : 'bg-amber-600 text-white hover:bg-amber-500'
            }`}
          >
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            <span>Vente POS</span>
          </button>

          <button
            onClick={() => handleNavigate('products')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              currentTab === 'products' || currentTab === 'inventory' ? 'text-amber-400 font-bold' : 'hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4 mb-0.5" />
            <span>Produits</span>
          </button>

          <button
            onClick={() => handleNavigate('deliveryNotes')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              currentTab === 'deliveryNotes' || currentTab === 'invoices' ? 'text-amber-400 font-bold' : 'hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-0.5" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Password change modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => alert('Mot de passe mis à jour avec succès.')}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
