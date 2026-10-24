import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DashboardStats, Product } from '../../types';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToTab: (tab: string, filter?: string) => void;
  currency: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab, currency }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [st, prods] = await Promise.all([
        api.getDashboardStats(),
        api.getProducts(),
      ]);
      setStats(st);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
          <span>Calcul des statistiques en temps réel...</span>
        </div>
      </div>
    );
  }

  const alertProducts = products.filter((p) => p.stockQuantity <= p.stockMin);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Aperçu Opérationnel</span>
          <h2 className="text-2xl font-black tracking-tight mt-0.5">Tableau de Bord CarrelageArwa</h2>
          <p className="text-slate-300 text-xs mt-1">
            Indicateurs financiers, valorisation des stocks et alertes calculés à partir de la base de données.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateToTab('pos')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Nouvelle Vente (Caisse)</span>
          </button>
          <button
            onClick={fetchStats}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventes du Jour</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.salesToday.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-slate-500">{currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Aujourd'hui en magasin</span>
          </div>
        </div>

        {/* Sales Current Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires Mois</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.salesCurrentMonth.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-slate-500">{currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Total des ventes facturées ce mois
          </div>
        </div>

        {/* Stock Valuation (Purchase Cost & Sale Value) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur du Stock (Achat)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.stockPurchaseValuation.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-slate-500">{currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Valeur vente : <span className="font-semibold text-slate-800">{stats.stockSellingValuation.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currency}</span>
          </div>
        </div>

        {/* Total Supplier Debt */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dette Fournisseurs</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {stats.totalSupplierDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-slate-500">{currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium flex justify-between">
            <span>Solde restant dû</span>
            <button
              onClick={() => onNavigateToTab('supplierPayments')}
              className="text-amber-700 hover:underline font-semibold"
            >
              Régler &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: INVENTORY METRICS & STOCK ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Products & Tiles Surface Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Volume & Métriques Stock</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('products')}
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Voir catalogue &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-slate-500">Articles actifs</div>
              <div className="text-lg font-black text-slate-800 mt-0.5">{stats.totalActiveProducts}</div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-lg">
              <div className="text-amber-800 font-medium">Surface Carrelage</div>
              <div className="text-lg font-black text-amber-900 mt-0.5">
                {stats.totalStockSurfaceM2.toLocaleString('fr-FR')} <span className="text-xs font-semibold">m²</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-slate-500">Achats du mois</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {stats.purchasesCurrentMonth.toLocaleString('fr-FR')} {currency}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-slate-500">Crédits Clients</div>
              <div className="text-sm font-bold text-indigo-700 mt-0.5">
                {stats.totalClientCredit.toLocaleString('fr-FR')} {currency}
              </div>
            </div>
          </div>
        </div>

        {/* Critical Stock Alerts Card */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm">Alertes Stock & Réapprovisionnement</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {stats.productsOutOfStock} rupture(s)
              </span>
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {stats.productsLowStock} stock bas
              </span>
            </div>
          </div>

          {alertProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tous les stocks sont à des niveaux optimaux. Aucune alerte en cours.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {alertProducts.slice(0, 5).map((p) => {
                const isOut = p.stockQuantity <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigateToTab('inventory', isOut ? 'out' : 'low')}
                    className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{p.designation}</div>
                      <div className="text-[10px] text-slate-500">
                        Réf: <span className="font-mono">{p.reference}</span> · Seuil min: {p.stockMin}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        isOut ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.productType === 'carrelage' && p.carrelageDetails ? (
                          `${p.carrelageDetails.boxesInStock} caisses (${p.carrelageDetails.totalSurfaceM2} m²)`
                        ) : (
                          `${p.stockQuantity} pièces`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CHARTS & ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by Day (Last 7 days Bar representation) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Évolution des Ventes (7 Derniers Jours)</h3>
              <p className="text-[11px] text-slate-500">Chiffre d'affaires journalier TTC</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">En dirhams (DH)</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {stats.salesByDay.map((day) => {
              const maxAmount = Math.max(...stats.salesByDay.map((d) => d.amount), 500);
              const heightPct = Math.max(8, (day.amount / maxAmount) * 100);

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.amount > 0 ? `${day.amount} DH` : '0'}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all group-hover:from-amber-700 group-hover:to-amber-500 shadow-2xs"
                  />
                  <span className="text-[10px] font-mono text-slate-500">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Produits les Plus Vendus</h3>
            <p className="text-[11px] text-slate-500">Classés par volume de chiffre d'affaires</p>
          </div>

          {stats.topSellingProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucune vente enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.topSellingProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <div className="truncate pr-2">
                    <div className="font-bold text-slate-800 truncate">{p.designation}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Réf: {p.reference}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">{p.revenue.toLocaleString('fr-FR')} {currency}</div>
                    <div className="text-[10px] text-slate-500">{p.quantity} unités</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT SALES & PURCHASES TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Dernières Ventes Récentes</h3>
            <button
              onClick={() => onNavigateToTab('invoices')}
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Historique complet &rarr;
            </button>
          </div>

          {stats.recentSales.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">Aucune vente récente.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentSales.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{s.clientName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                      <span className="font-mono text-amber-800">{s.bonLivraisonNumber}</span>
                      <span>·</span>
                      <span>{s.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">{s.netAPayer.toFixed(2)} {currency}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded capitalize ${
                      s.paymentStatus === 'paye' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Derniers Achats Fournisseurs</h3>
            <button
              onClick={() => onNavigateToTab('purchases')}
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Historique achats &rarr;
            </button>
          </div>

          {stats.recentPurchases.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">Aucun achat récent.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentPurchases.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{p.supplierName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                      <span className="font-mono text-blue-700">{p.documentNumber}</span>
                      <span>·</span>
                      <span>{p.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">{p.totalTTC.toFixed(2)} {currency}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded capitalize ${
                      p.paymentStatus === 'paye' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
