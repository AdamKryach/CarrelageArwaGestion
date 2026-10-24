import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Purchase, Supplier, Product, StoreSettings } from '../../types';
import { Truck, Plus, Search, Calendar, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PurchasesViewProps {
  settings: StoreSettings;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ settings }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; boxesCount: number; unitPrice: number }[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [purs, sups, prods] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(purs);
      setSuppliers(sups);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setSupplierId(suppliers[0]?.id || '');
    setDocumentNumber(`BA-${new Date().getFullYear()}-${settings.nextPurchaseNumber || 101}`);
    setDate(new Date().toISOString().split('T')[0]);
    setPurchaseItems([{ productId: products[0]?.id || '', quantity: 10, boxesCount: 10, unitPrice: products[0]?.prixAchat || 50 }]);
    setAmountPaid(0);
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { productId: products[0]?.id || '', quantity: 1, boxesCount: 1, unitPrice: products[0]?.prixAchat || 50 }
    ]);
  };

  const removeItemRow = (idx: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const copy = [...purchaseItems];
    (copy[idx] as any)[field] = val;

    if (field === 'productId') {
      const p = products.find((x) => x.id === val);
      if (p) {
        copy[idx].unitPrice = p.prixAchat;
      }
    }
    setPurchaseItems(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.length === 0) return;

    setErrorMsg('');
    setIsSaving(true);
    try {
      await api.createPurchase({
        supplierId,
        documentNumber,
        date,
        items: purchaseItems,
        amountPaid: Number(amountPaid),
        notes,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement de l’achat.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Achats Fournisseurs & Réceptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enregistrement des bons d'achat, entrée en stock automatique et suivi des dettes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Réception d'Achat</span>
        </button>
      </div>

      {/* PURCHASES LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">N° Document</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Fournisseur</th>
                <th className="py-3 px-3">Articles</th>
                <th className="py-3 px-3 text-right">Total TTC</th>
                <th className="py-3 px-3 text-right">Payé</th>
                <th className="py-3 px-3 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">État Règlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun achat fournisseur enregistré.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">
                      {pur.documentNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{pur.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{pur.supplierName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {pur.items.map((it, i) => (
                        <div key={i} className="truncate max-w-xs text-[11px]">
                          {it.designation} ({it.boxesCount ? `${it.boxesCount} caisses` : `${it.quantity} pcs`})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {pur.totalTTC.toFixed(2)} {settings.currency}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      {pur.amountPaid.toFixed(2)} {settings.currency}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {pur.balanceDue.toFixed(2)} {settings.currency}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        pur.paymentStatus === 'paye'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pur.paymentStatus === 'partiel'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pur.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Enregistrer un Achat / Arrivage Stock</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fournisseur *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">N° Bon d'achat / Facture *</label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date réception *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Articles réceptionnés</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {purchaseItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isCarr = prod?.productType === 'carrelage';

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                          className="flex-1 min-w-[160px] px-2 py-1 border border-slate-300 rounded text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.designation}</option>
                          ))}
                        </select>

                        {isCarr ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="Caisses"
                              value={item.boxesCount}
                              onChange={(e) => updateItem(idx, 'boxesCount', parseInt(e.target.value) || 1)}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-right font-mono"
                            />
                            <span className="text-[10px] text-slate-500">caisses</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-right font-mono"
                            />
                            <span className="text-[10px] text-slate-500">pcs</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 border border-slate-300 rounded text-right font-mono"
                          />
                          <span className="text-[10px] text-slate-500">{settings.currency}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amount paid immediately */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Acompte ou paiement immédiat versé ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Observations</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Chauffeur, N° camion, conditions..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Valider la réception en stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
