import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Layers,
  ClipboardList,
  Truck,
  Users2,
  Receipt,
  UserCheck,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Settings,
  Code2,
  ChevronDown,
  ChevronRight,
  X,
  PackageCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  outOfStockCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  outOfStockCount,
  isOpen = false,
  onClose,
}) => {
  const { user, hasAccess, settings } = useAuth();

  // State for dropdown menus
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    products: true,
    suppliers: true,
    documents: true,
  });

  // Automatically expand group containing active tab
  useEffect(() => {
    if (['products', 'inventory', 'categories'].includes(currentTab)) {
      setOpenGroups((prev) => ({ ...prev, products: true }));
    } else if (['purchases', 'suppliers', 'supplierPayments'].includes(currentTab)) {
      setOpenGroups((prev) => ({ ...prev, suppliers: true }));
    } else if (['deliveryNotes', 'invoices', 'clients'].includes(currentTab)) {
      setOpenGroups((prev) => ({ ...prev, documents: true }));
    }
  }, [currentTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  // Check section access permissions
  const canAccess = (key: string) => hasAccess(key as any);

  // Group items with permissions
  const productItems = [
    { id: 'products', label: 'Catalogue Produits', icon: Boxes, permissionKey: 'products' },
    {
      id: 'inventory',
      label: 'Stock & Mouvements',
      icon: ClipboardList,
      permissionKey: 'inventory',
      badge: outOfStockCount > 0 ? `${outOfStockCount}` : undefined,
      badgeColor: 'bg-rose-500',
    },
    { id: 'categories', label: 'Catégories', icon: Layers, permissionKey: 'categories' },
  ].filter((item) => canAccess(item.permissionKey));

  const supplierItems = [
    { id: 'purchases', label: 'Achats Fournisseurs', icon: Truck, permissionKey: 'purchases' },
    { id: 'suppliers', label: 'Fournisseurs', icon: Users2, permissionKey: 'suppliers' },
    { id: 'supplierPayments', label: 'Paiements Fournisseurs', icon: Receipt, permissionKey: 'supplierPayments' },
  ].filter((item) => canAccess(item.permissionKey));

  const documentItems = [
    { id: 'deliveryNotes', label: 'Bons de Livraison', icon: FileText, permissionKey: 'deliveryNotes' },
    { id: 'invoices', label: 'Factures Commerciales', icon: FileSpreadsheet, permissionKey: 'invoices' },
    { id: 'clients', label: 'Clients & Soldes', icon: UserCheck, permissionKey: 'clients' },
  ].filter((item) => canAccess(item.permissionKey));

  const isProductsActive = ['products', 'inventory', 'categories'].includes(currentTab);
  const isSuppliersActive = ['purchases', 'suppliers', 'supplierPayments'].includes(currentTab);
  const isDocumentsActive = ['deliveryNotes', 'invoices', 'clients'].includes(currentTab);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            CA
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-white text-base leading-tight truncate">
              {settings?.appName || 'Carrelage Arwa'}
            </h2>
            <span className="text-[11px] text-amber-400 font-medium tracking-wide">
              Meknès · Maroc
            </span>
          </div>
        </div>

        {/* Close Button for mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Principale
        </div>

        {/* 1. TABLEAU DE BORD (Direct - NO drop menu) */}
        {canAccess('dashboard') && (
          <button
            onClick={() => handleItemClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              currentTab === 'dashboard'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentTab === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`} />
              <span className="truncate">Tableau de bord</span>
            </div>
          </button>
        )}

        {/* 2. VENTE & CAISSE (Direct - NO drop menu) */}
        {canAccess('pos') && (
          <button
            onClick={() => handleItemClick('pos')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              currentTab === 'pos'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm font-bold ring-1 ring-amber-400/30'
                : 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <ShoppingCart className={`w-4 h-4 shrink-0 ${currentTab === 'pos' ? 'text-white' : 'text-amber-400'}`} />
              <span className="truncate">Vente & Caisse</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-semibold">
              POS
            </span>
          </button>
        )}

        {/* 3. PRODUITS & STOCK (DROP MENU) */}
        {productItems.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => toggleGroup('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isProductsActive
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Boxes className={`w-4 h-4 shrink-0 ${isProductsActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">Produits & Stock</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {outOfStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Alertes de stock" />
                )}
                {openGroups.products ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Dropdown submenu items */}
            {openGroups.products && (
              <div className="ml-4 pl-2 my-1 border-l border-slate-800 space-y-1">
                {productItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-amber-600/90 text-white font-semibold shadow-2xs'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-amber-500'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. FOURNISSEURS (DROP MENU) */}
        {supplierItems.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => toggleGroup('suppliers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isSuppliersActive
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Truck className={`w-4 h-4 shrink-0 ${isSuppliersActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">Fournisseurs</span>
              </div>
              {openGroups.suppliers ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Dropdown submenu items */}
            {openGroups.suppliers && (
              <div className="ml-4 pl-2 my-1 border-l border-slate-800 space-y-1">
                {supplierItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-amber-600/90 text-white font-semibold shadow-2xs'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. DOCUMENTS & FACTURATION (DROP MENU) */}
        {documentItems.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => toggleGroup('documents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isDocumentsActive
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isDocumentsActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">Documents & Factures</span>
              </div>
              {openGroups.documents ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Dropdown submenu items */}
            {openGroups.documents && (
              <div className="ml-4 pl-2 my-1 border-l border-slate-800 space-y-1">
                {documentItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-amber-600/90 text-white font-semibold shadow-2xs'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. RAPPORTS & FINANCES (Direct - NO drop menu) */}
        {canAccess('reports') && (
          <button
            onClick={() => handleItemClick('reports')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              currentTab === 'reports'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <BarChart3 className={`w-4 h-4 shrink-0 ${currentTab === 'reports' ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`} />
              <span className="truncate">Rapports & Finances</span>
            </div>
          </button>
        )}

        {/* 7. PARAMETRES (Direct - NO drop menu) */}
        {canAccess('settings') && (
          <button
            onClick={() => handleItemClick('settings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              currentTab === 'settings'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Settings className={`w-4 h-4 shrink-0 ${currentTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`} />
              <span className="truncate">Paramètres</span>
            </div>
          </button>
        )}

        {/* DEVELOPER SECTION — ONLY VISIBLE TO DEVELOPER ROLE */}
        {user?.role === 'developer' && (
          <div className="pt-3 mt-3 border-t border-slate-800">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>Administration Système</span>
              <span className="bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded text-[9px]">Dev Mode</span>
            </div>

            <button
              onClick={() => handleItemClick('developer')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                currentTab === 'developer'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md font-bold'
                  : 'text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 border border-amber-900/40 mt-1'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Developer Panel</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />
            </button>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              user?.role === 'developer' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-white'
            }`}>
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  user?.role === 'developer' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span className="capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Permanent on lg screens */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 min-h-screen border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer: Slide-over overlay on screens < lg */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
