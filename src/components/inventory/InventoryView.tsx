import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product, StockMovement, StoreSettings } from '../../types';
import {
  ClipboardList,
  Search,
  Filter,
  History,
  AlertTriangle,
  ArrowUpDown,
  X,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface InventoryViewProps {
  settings: StoreSettings;
  initialFilter?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ settings, initialFilter }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'all');
  const [isLoading, setIsLoading] = useState(true);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [movementType, setMovementType] = useState<string>('correction');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, mvts] = await Promise.all([
        api.getProducts(),
        api.getStockMovements(),
      ]);
      setProducts(prods);
      setMovements(mvts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (p: Product) => {
    setSelectedProduct(p);
    setNewQuantity(p.stockQuantity);
    setAdjustmentReason('');
    setMovementType('correction');
    setErrorMsg('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!adjustmentReason.trim()) {
      setErrorMsg('Le motif de correction est obligatoire pour l’audit.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await api.adjustStock({
        productId: selectedProduct.id,
        newQuantity,
        reason: adjustmentReason,
        movementType,
      });
      setAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’ajustement de stock.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'low' && (p.stockQuantity > p.stockMin || p.stockQuantity <= 0)) return false;
    if (statusFilter === 'out' && p.stockQuantity > 0) return false;
    if (!search.trim()) return true;

    const t = search.toLowerCase();
    return p.designation.toLowerCase().includes(t) || p.reference.toLowerCase().includes(t);
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventaire & Mouvements de Stock</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des caisses/carreaux, valorisation et journal d'audit des flux magasin.
          </p>
        </div>

        {/* Tab switch between Stock and Movements Ledger */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            État des Stocks
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grand Livre des Mouvements
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher désignation ou référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
              >
                <option value="all">Tous les états</option>
                <option value="low">Stock bas uniquement</option>
                <option value="out">Ruptures uniquement</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Produit & Réf</th>
                    <th className="py-3 px-3 text-center">Type</th>
                    <th className="py-3 px-3 text-center">Caisses Complètes</th>
                    <th className="py-3 px-3 text-center">Carreaux Détail</th>
                    <th className="py-3 px-3 text-center">Surface Totale</th>
                    <th className="py-3 px-3 text-right">Valeur Stock (Achat)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isCarrelage = p.productType === 'carrelage' && p.carrelageDetails;
                    const valuation = isCarrelage
                      ? (p.carrelageDetails?.totalSurfaceM2 || 0) * (p.carrelageDetails?.purchasePricePerM2 || 0)
                      : p.stockQuantity * p.prixAchat;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <div className="font-bold text-slate-900">{p.designation}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Réf: {p.reference}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            isCarrelage ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.productType}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {isCarrelage ? `${p.carrelageDetails?.boxesInStock} caisses` : '-'}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          {isCarrelage ? `${p.carrelageDetails?.looseTilesInStock} car.` : `${p.stockQuantity} pcs`}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                          {isCarrelage ? `${p.carrelageDetails?.totalSurfaceM2} m²` : '-'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {valuation.toFixed(2)} {settings.currency}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Ajuster Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STOCK MOVEMENTS LEDGER TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Registre des Mouvements de Stock</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{movements.length} écritures</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-3">Produit & Réf</th>
                  <th className="py-3 px-3 text-center">Type Mouvement</th>
                  <th className="py-3 px-3 text-center">Avant</th>
                  <th className="py-3 px-3 text-center">Mouvement</th>
                  <th className="py-3 px-3 text-center">Après</th>
                  <th className="py-3 px-3">Réf / Doc</th>
                  <th className="py-3 px-4">Opérateur & Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = m.quantityChanged > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {m.date ? m.date.slice(0, 16).replace('T', ' ') : m.createdAt.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{m.productDesignation}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Réf: {m.productReference}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          m.movementType === 'vente'
                            ? 'bg-rose-100 text-rose-800'
                            : m.movementType === 'achat'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {m.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{m.quantityBefore}</td>
                      <td className={`py-2.5 px-3 text-center font-mono font-bold ${
                        isPositive ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isPositive ? `+${m.quantityChanged}` : m.quantityChanged}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">{m.quantityAfter}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{m.referenceId || '-'}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{m.userName}</div>
                        <div className="text-[10px] text-slate-500">{m.reason || 'Aucun motif'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL WITH MANDATORY REASON */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setAdjustModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Ajustement de Stock Manuel</h3>
                <p className="text-xs text-slate-500">{selectedProduct.designation}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-600">Quantité actuelle en stock :</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedProduct.stockQuantity} {selectedProduct.productType === 'carrelage' ? 'carreaux' : 'pièces'}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nouvelle quantité réelle comptée *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Type d'opération</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="correction">Correction inventaire physique</option>
                  <option value="casse">Casse / Produit détérioré</option>
                  <option value="perte">Perte constatée</option>
                  <option value="retour_client">Retour client</option>
                  <option value="retour_fournisseur">Retour fournisseur</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Motif obligatoire de l'ajustement (Audit) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="ex: Inventaire trimestriel magasin, casse manutention..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Confirmer l’ajustement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
