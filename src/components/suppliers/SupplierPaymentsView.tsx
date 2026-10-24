import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Supplier, SupplierPayment, StoreSettings, Purchase } from '../../types';
import { Receipt, Plus, Search, Calendar, CheckCircle2, AlertCircle, X, Printer } from 'lucide-react';

interface SupplierPaymentsViewProps {
  settings: StoreSettings;
}

export const SupplierPaymentsView: React.FC<SupplierPaymentsViewProps> = ({ settings }) => {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cheque' | 'virement' | 'autre'>('cheque');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Voucher print modal
  const [voucherPayment, setVoucherPayment] = useState<SupplierPayment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pmts, sups, purs] = await Promise.all([
        api.getSupplierPayments(),
        api.getSuppliers(),
        api.getPurchases(),
      ]);
      setPayments(pmts);
      setSuppliers(sups);
      setPurchases(purs);
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
    const defaultSup = suppliers.find((s) => s.balanceDue > 0) || suppliers[0];
    setSupplierId(defaultSup?.id || '');
    setPurchaseId('');
    setAmount(defaultSup?.balanceDue || 0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cheque');
    setPaymentReference('');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    setPurchaseId('');
    const s = suppliers.find((x) => x.id === id);
    if (s) {
      setAmount(s.balanceDue);
    }
  };

  const handlePurchaseChange = (purId: string) => {
    setPurchaseId(purId);
    if (purId) {
      const p = purchases.find((x) => x.id === purId);
      if (p) setAmount(p.balanceDue);
    } else {
      const s = suppliers.find((x) => x.id === supplierId);
      if (s) setAmount(s.balanceDue);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || amount <= 0) {
      setErrorMsg('Veuillez sélectionner un fournisseur et indiquer un montant supérieur à 0.');
      return;
    }

    setErrorMsg('');
    setIsSaving(true);
    try {
      const newPayment = await api.createSupplierPayment({
        supplierId,
        purchaseId: purchaseId || undefined,
        amount: Number(amount),
        date,
        paymentMethod,
        paymentReference,
        notes,
      });

      setIsModalOpen(false);
      loadData();
      setVoucherPayment(newPayment);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du versement.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter unpaid purchases of selected supplier
  const supplierUnpaidPurchases = purchases.filter(
    (p) => p.supplierId === supplierId && p.balanceDue > 0
  );

  const selectedSupplierObj = suppliers.find((s) => s.id === supplierId);
  const totalDebt = suppliers.reduce((acc, s) => acc + s.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Règlements & Paiements Fournisseurs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dette globale en cours : <span className="font-bold text-rose-700">{totalDebt.toFixed(2)} {settings.currency}</span>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Règlement</span>
        </button>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Grand Livre des Règlements Émis</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{payments.length} paiements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Fournisseur</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Réf / Chèque</th>
                <th className="py-3 px-3 text-right">Montant Versé</th>
                <th className="py-3 px-3">Opérateur</th>
                <th className="py-3 px-4 text-center">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun paiement fournisseur enregistré.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-600">{p.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.supplierName}</td>
                    <td className="py-3 px-3 capitalize">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{p.paymentReference || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {p.amount.toFixed(2)} {settings.currency}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.createdByName}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setVoucherPayment(p)}
                        className="text-amber-700 hover:text-amber-900 font-semibold p-1 hover:bg-amber-50 rounded"
                        title="Imprimer le bon de caisse"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>Émettre un Règlement Fournisseur</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fournisseur Bénéficiaire *</label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Solde dû: {s.balanceDue.toFixed(2)} {settings.currency})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSupplierObj && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 flex justify-between font-medium">
                  <span>Dette restante actuelle :</span>
                  <span className="font-mono font-bold">{selectedSupplierObj.balanceDue.toFixed(2)} {settings.currency}</span>
                </div>
              )}

              {supplierUnpaidPurchases.length > 0 && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Affecter à une facture précise (Optionnel)
                  </label>
                  <select
                    value={purchaseId}
                    onChange={(e) => handlePurchaseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Règlement global sur solde</option>
                    {supplierUnpaidPurchases.map((pur) => (
                      <option key={pur.id} value={pur.id}>
                        {pur.documentNumber} ({pur.date}) — Reste {pur.balanceDue.toFixed(2)} {settings.currency}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Montant à Régler *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date d'émission *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mode de Paiement *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="cheque">Chèque bancaire</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces / Caisse</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">N° Chèque / Virement</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="ex: CHQ-784920"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarques / Libellé</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Banque émettrice, échéance..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
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
                  {isSaving ? 'Enregistrement...' : 'Confirmer le règlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT VOUCHER PRINT MODAL */}
      {voucherPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setVoucherPayment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900">REÇU DE PAIEMENT FOURNISSEUR</h3>
              <p className="text-xs text-slate-500 font-mono">Pièce de caisse & comptabilité</p>
            </div>

            <div className="space-y-2 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50">
              <div className="flex justify-between">
                <span className="text-slate-500">Bénéficiaire :</span>
                <span className="font-bold text-slate-900">{voucherPayment.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date d'opération :</span>
                <span className="font-mono">{voucherPayment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode :</span>
                <span className="font-semibold capitalize">{voucherPayment.paymentMethod}</span>
              </div>
              {voucherPayment.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Référence pièce :</span>
                  <span className="font-mono">{voucherPayment.paymentReference}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Montant Réglé :</span>
                <span className="text-emerald-700">{voucherPayment.amount.toFixed(2)} {settings.currency}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Reçu</span>
              </button>
              <button
                onClick={() => setVoucherPayment(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
