import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, KeyRound, AlertTriangle, ShieldCheck, Store, Menu } from 'lucide-react';

interface NavbarProps {
  pageTitle: string;
  lowStockCount: number;
  outOfStockCount: number;
  onOpenPasswordModal: () => void;
  onNavigateToStockAlerts: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle,
  lowStockCount,
  outOfStockCount,
  onOpenPasswordModal,
  onNavigateToStockAlerts,
  onToggleMobileMenu,
}) => {
  const { user, logout, settings } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
        {/* Mobile / Tablet Menu Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="overflow-hidden">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">
            {pageTitle}
          </h1>
        </div>

        <span className="hidden md:inline-block text-xs text-slate-300">|</span>
        <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 font-medium truncate">
          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{settings?.businessName || 'Carrelage Arwa Meknès'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Stock Alerts Quick Indicator */}
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <button
            onClick={onNavigateToStockAlerts}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shadow-2xs"
            title="Consulter les alertes de stock"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>
              {outOfStockCount > 0 && <span className="text-rose-700">{outOfStockCount} rupture(s)</span>}
              {outOfStockCount > 0 && lowStockCount > 0 && ' · '}
              {lowStockCount > 0 && <span>{lowStockCount} stock bas</span>}
            </span>
          </button>
        )}

        {/* User Role Badge */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800">{user?.name}</div>
            <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1">
              {user?.role === 'developer' ? (
                <span className="text-amber-600 font-semibold flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Développeur
                </span>
              ) : (
                <span className="text-slate-600 font-medium">Administrateur</span>
              )}
            </div>
          </div>

          {/* Change password button */}
          <button
            onClick={onOpenPasswordModal}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Changer de mot de passe"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors text-xs font-medium"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </div>
    </header>
  );
};
