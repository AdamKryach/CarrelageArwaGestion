import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Client, StoreSettings, Sale } from '../../types';
import { UserCheck, Plus, Edit2, Trash2, Phone, Mail, Building, FileSpreadsheet, X } from 'lucide-react';

interface ClientsViewProps {
  settings: StoreSettings;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ settings }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Client sales history modal
  const [selectedClientSales, setSelectedClientSales] = useState<{ client: Client; sales: Sale[] } | null>(null);

  // Form
  const [clientType, setClientType] = useState<'particulier' | 'entreprise'>('particulier');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [ice, setIce] = useState('');
  const [ifCode, setIfCode] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [clis, sls] = await Promise.all([
        api.getClients(),
        api.getSales(),
      ]);
      setClients(clis);
      setSales(sls);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingClient(null);
    setClientType('particulier');
    setName('');
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

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setClientType(c.clientType);
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCity(c.city || 'Casablanca');
    setIce(c.ice || '');
    setIfCode(c.ifCode || '');
    setNotes(c.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openClientSales = (client: Client) => {
    const clientSales = sales.filter((s) => s.clientId === client.id);
    setSelectedClientSales({ client, sales: clientSales });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = { clientType, name, phone, email, address, city, ice, ifCode, notes };
      if (editingClient) {
        await api.updateClient(editingClient.id, payload);
      } else {
        await api.createClient(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde du client.');
    }
  };

  const handleDelete = async (c: Client) => {
    if (!window.confirm(`Supprimer le client "${c.name}" ?`)) return;
    try {
      await api.deleteClient(c.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Impossible de supprimer.');
    }
  };

  const totalCreditDue = clients.reduce((acc, c) => acc + c.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Clients & Ventes à Crédit</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Encours clients global : <span className="font-bold text-indigo-700">{totalCreditDue.toFixed(2)} {settings.currency}</span>
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded capitalize">
                    {c.clientType}
                  </span>
                </div>
                {c.balanceDue > 0 ? (
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Crédit dû
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Soldé
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                {c.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.ice && (
                  <div className="text-[10px] font-mono text-slate-500">
                    ICE: <span className="font-semibold">{c.ice}</span>
                  </div>
                )}
              </div>

              {/* Financial Metrics */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500">Total Ventes :</span>
                  <div className="font-bold text-slate-900 font-mono">
                    {c.totalSales.toFixed(2)} {settings.currency}
                  </div>
                </div>

                <div className="bg-indigo-50 p-2 rounded-lg">
                  <span className="text-[10px] text-indigo-700">Reste Dû :</span>
                  <div className="font-black text-indigo-800 font-mono">
                    {c.balanceDue.toFixed(2)} {settings.currency}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openClientSales(c)}
                className="text-xs font-semibold text-amber-700 hover:underline flex items-center space-x-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Historique Ventes</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
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

      {/* CREATE / EDIT CLIENT MODAL */}
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
              {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Type de client</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClientType('particulier')}
                    className={`py-2 rounded-lg font-bold border ${
                      clientType === 'particulier'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Particulier
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientType('entreprise')}
                    className={`py-2 rounded-lg font-bold border ${
                      clientType === 'entreprise'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Entreprise / Promoteur BTP
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nom complet ou Raison sociale *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Entreprise BTP Atlas ou M. Karim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0661..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {clientType === 'entreprise' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ICE Entreprise</label>
                    <input
                      type="text"
                      value={ice}
                      onChange={(e) => setIce(e.target.value)}
                      placeholder="15 chiffres"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">I.F.</label>
                    <input
                      type="text"
                      value={ifCode}
                      onChange={(e) => setIfCode(e.target.value)}
                      placeholder="Numéro IF"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresse chantier / siège..."
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

      {/* CLIENT SALES HISTORY MODAL */}
      {selectedClientSales && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClientSales(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900">{selectedClientSales.client.name}</h3>
              <p className="text-xs text-slate-500">
                Total des ventes facturées : {selectedClientSales.client.totalSales.toFixed(2)} {settings.currency} ·{' '}
                Reste dû : <span className="font-bold text-indigo-700">{selectedClientSales.client.balanceDue.toFixed(2)} {settings.currency}</span>
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 font-bold uppercase text-[9.5px]">
                  <tr>
                    <th className="py-2.5 px-3">N° BL / Facture</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 text-right">Net à Payer</th>
                    <th className="py-2.5 px-2 text-right">Payé</th>
                    <th className="py-2.5 px-2 text-right">Reste</th>
                    <th className="py-2.5 px-3 text-center">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedClientSales.sales.length === 0 ? (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-400">Aucune vente enregistrée.</td></tr>
                  ) : (
                    selectedClientSales.sales.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 font-mono font-bold text-amber-800">{s.bonLivraisonNumber}</td>
                        <td className="py-2 px-2 text-slate-600">{s.date}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{s.netAPayer.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-700">{s.amountPaid.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-indigo-700">{s.balanceDue.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center capitalize">{s.paymentStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
