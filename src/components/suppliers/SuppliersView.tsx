import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Supplier, StoreSettings, Purchase, SupplierPayment } from '../../types';
import { Users2, Plus, Edit2, Trash2, Phone, Mail, Building, FileText, X } from 'lucide-react';

interface SuppliersViewProps {
  settings: StoreSettings;
  onNavigateToPayments?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ settings, onNavigateToPayments }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<{ supplier: Supplier; purchases: Purchase[]; payments: SupplierPayment[] } | null>(null);

  // Form
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [ice, setIce] = useState('');
  const [ifCode, setIfCode] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreate = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Casablanca');
    setIce('');
    setIfCode('');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setCity(s.city || 'Casablanca');
    setIce(s.ice || '');
    setIfCode(s.ifCode || '');
    setNotes(s.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openDetails = async (supplierId: string) => {
    try {
      const data = await api.getSupplierDetails(supplierId);
      setSelectedDetails(data);
      setDetailsModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du chargement des détails.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = { name, contactPerson, phone, email, address, city, ice, ifCode, notes };
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, payload);
      } else {
        await api.createSupplier(payload);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!window.confirm(`Supprimer le fournisseur "${s.name}" ?`)) return;
    try {
      await api.deleteSupplier(s.id);
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Impossible de supprimer.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Fournisseurs & Soldes Dus</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des usines de carrelage, robinetterie, chauffe-eau et balances fournisseurs.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div key={sup.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                  {sup.contactPerson && (
                    <div className="text-[11px] text-slate-500">Contact: {sup.contactPerson}</div>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sup.balanceDue > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {sup.balanceDue > 0 ? 'Dette en cours' : 'À jour'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                )}
                {sup.ice && (
                  <div className="text-[10px] font-mono text-slate-500">
                    ICE: <span className="font-semibold">{sup.ice}</span>
                  </div>
                )}
              </div>

              {/* Debt and Purchases Metrics */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500">Total Achats :</span>
                  <div className="font-bold text-slate-900 font-mono">
                    {sup.totalPurchases.toFixed(2)} {settings.currency}
                  </div>
                </div>

                <div className="bg-rose-50 p-2 rounded-lg">
                  <span className="text-[10px] text-rose-700">Reste Dû :</span>
                  <div className="font-black text-rose-700 font-mono">
                    {sup.balanceDue.toFixed(2)} {settings.currency}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openDetails(sup.id)}
                className="text-xs font-semibold text-amber-700 hover:underline flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Factures & Paiements</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEdit(sup)}
                  className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sup)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-4">
              {editingSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Raison Sociale / Nom *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Cérame Afrique Maroc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Commercial</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="ex: M. Adil"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 5..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ICE (Maroc)</label>
                  <input
                    type="text"
                    value={ice}
                    onChange={(e) => setIce(e.target.value)}
                    placeholder="15 chiffres"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Identifiant Fiscal (IF)</label>
                  <input
                    type="text"
                    value={ifCode}
                    onChange={(e) => setIfCode(e.target.value)}
                    placeholder="ex: 1849201"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Adresse & Ville</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Zone Industrielle..."
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER INVOICE & PAYMENT HISTORY MODAL */}
      {detailsModalOpen && selectedDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900">{selectedDetails.supplier.name}</h3>
              <p className="text-xs text-slate-500">
                Solde actuel restant dû : <span className="font-bold text-rose-700">{selectedDetails.supplier.balanceDue.toFixed(2)} {settings.currency}</span>
              </p>
            </div>

            {/* Invoices List */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Historique des Achats & Factures Fournisseur</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 font-bold uppercase text-[9.5px]">
                      <tr>
                        <th className="py-2 px-3">N° Doc</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2 text-right">Montant</th>
                        <th className="py-2 px-2 text-right">Payé</th>
                        <th className="py-2 px-2 text-right">Reste</th>
                        <th className="py-2 px-3 text-center">État</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetails.purchases.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-slate-400">Aucun achat.</td></tr>
                      ) : (
                        selectedDetails.purchases.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono font-bold text-amber-800">{p.documentNumber}</td>
                            <td className="py-2 px-2 text-slate-600">{p.date}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold">{p.totalTTC.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-700">{p.amountPaid.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-rose-700">{p.balanceDue.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center capitalize">{p.paymentStatus}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Historique des Règlements Émis</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 font-bold uppercase text-[9.5px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-2">Mode</th>
                        <th className="py-2 px-2">Réf Chèque/Virement</th>
                        <th className="py-2 px-2 text-right">Montant Réglé</th>
                        <th className="py-2 px-3">Saisi Par</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetails.payments.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-400">Aucun règlement enregistré.</td></tr>
                      ) : (
                        selectedDetails.payments.map((sp) => (
                          <tr key={sp.id}>
                            <td className="py-2 px-3 font-mono text-slate-600">{sp.date}</td>
                            <td className="py-2 px-2 capitalize">{sp.paymentMethod}</td>
                            <td className="py-2 px-2 font-mono text-slate-700">{sp.paymentReference || '-'}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                              {sp.amount.toFixed(2)} {settings.currency}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{sp.createdByName}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
