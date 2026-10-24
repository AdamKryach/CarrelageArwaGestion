import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sale, DocumentTemplate, StoreSettings } from '../../types';
import { DocumentRenderer } from './DocumentRenderer';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Ban,
  Search,
  AlertCircle,
  X,
  Smartphone,
  Laptop,
  CheckCircle2
} from 'lucide-react';

interface DocumentsListViewProps {
  type: 'bon_livraison' | 'facture';
  settings: StoreSettings;
  templates: DocumentTemplate[];
}

export const DocumentsListView: React.FC<DocumentsListViewProps> = ({ type, settings, templates }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<'bon_livraison' | 'facture'>(type);
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const isFacture = type === 'facture';
  const pageTitle = isFacture ? 'Registre des Factures Commerciales' : 'Registre des Bons de Livraison';
  const template = templates.find((t) => t.type === selectedDocType);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleCancelSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSale || !cancelReason.trim()) return;

    setErrorMsg('');
    try {
      await api.cancelSale(cancelModalSale.id, cancelReason);
      setCancelModalSale(null);
      setCancelReason('');
      loadSales();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’annulation.');
    }
  };

  const openDocument = (sale: Sale, docType: 'bon_livraison' | 'facture') => {
    setSelectedDocType(docType);
    setSelectedSale(sale);
  };

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;

    const t = search.toLowerCase();
    const blNum = s.bonLivraisonNumber || '';
    const facNum = s.factureNumber || '';
    return (
      blNum.toLowerCase().includes(t) ||
      facNum.toLowerCase().includes(t) ||
      s.clientName.toLowerCase().includes(t) ||
      (s.clientPhone && s.clientPhone.includes(t)) ||
      s.date.includes(t)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Document View / Print Modal */}
      {selectedSale && (
        <DocumentRenderer
          sale={selectedSale}
          type={selectedDocType}
          template={template}
          settings={settings}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {/* Top Banner : Cross-Device Phone / PC Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 rounded-2xl text-white shadow-md border border-amber-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">Stockage & Synchronisation Permanente</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Actif
              </span>
            </div>
            <p className="text-slate-300 text-[11.5px] mt-0.5">
              Toutes les ventes validées depuis votre <strong>téléphone</strong> ou <strong>tablette</strong> sont automatiquement archivées en base de données. Vous pouvez rééditer et imprimer chaque <strong>Bon de Livraison</strong> (modèle officiel) ou <strong>Facture</strong> à tout moment depuis ce PC.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Laptop className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-semibold text-slate-300">Prêt pour impression PC</span>
        </div>
      </div>

      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{pageTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique complet des documents émis ({sales.length} ventes enregistrées).
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° document, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">N° Bon Livraison</th>
                <th className="py-3 px-3">N° Facture</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Articles</th>
                <th className="py-3 px-3 text-right">Net à Payer</th>
                <th className="py-3 px-3 text-center">Règlement</th>
                <th className="py-3 px-4 text-center">Impression Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-medium text-slate-500">Aucun document dans le registre pour le moment.</p>
                    <p className="text-[11px] text-slate-400">Effectuez une première vente depuis la Caisse / POS pour générer un Bon de Livraison et une Facture.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const blDisplay = s.bonLivraisonNumber || '-';
                  const facDisplay = s.factureNumber || '-';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${s.isCancelled ? 'bg-rose-50/40 opacity-75' : ''}`}
                    >
                      {/* N° BL */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        <button
                          onClick={() => openDocument(s, 'bon_livraison')}
                          className="hover:underline text-amber-800 font-bold cursor-pointer"
                          title="Voir le Bon de Livraison"
                        >
                          {blDisplay}
                        </button>
                      </td>

                      {/* N° Facture */}
                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                        <button
                          onClick={() => openDocument(s, 'facture')}
                          className="hover:underline text-slate-900 cursor-pointer"
                          title="Voir la Facture"
                        >
                          {facDisplay}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{s.date}</td>

                      {/* Client */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{s.clientName}</div>
                        {s.clientPhone && (
                          <div className="text-[10px] text-slate-500">{s.clientPhone}</div>
                        )}
                      </td>

                      {/* Articles summary */}
                      <td className="py-3 px-3 text-slate-600 max-w-xs">
                        <div className="text-[11px] font-medium text-slate-800">
                          {s.items?.length || 0} article(s)
                        </div>
                        {s.items && s.items.slice(0, 2).map((it, i) => (
                          <div key={i} className="text-[10.5px] text-slate-500 truncate">
                            • {it.designation} ({it.quantity} {it.productType === 'carrelage' ? 'm²' : 'pcs'})
                          </div>
                        ))}
                        {s.items && s.items.length > 2 && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            +{s.items.length - 2} autre(s)...
                          </div>
                        )}
                      </td>

                      {/* Net à Payer */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {Number(s.netAPayer ?? s.totalHT ?? 0).toFixed(2)} {settings.currency || 'DH'}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3 text-center capitalize text-slate-700">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                          {s.paymentMethod || 'Espèces'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Print Bon de Livraison (uploaded model) */}
                          <button
                            onClick={() => openDocument(s, 'bon_livraison')}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg flex items-center space-x-1 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title="Imprimer le Bon de Livraison officiel"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer BL</span>
                          </button>

                          {/* Print Facture (Developer Portal model) */}
                          <button
                            onClick={() => openDocument(s, 'facture')}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-lg flex items-center space-x-1 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title="Imprimer la Facture Commerciale"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                            <span>Facture</span>
                          </button>

                          {/* Cancel if needed */}
                          {!s.isCancelled && (
                            <button
                              onClick={() => setCancelModalSale(s)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Annuler la vente"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALE CANCELLATION MODAL */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setCancelModalSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Annuler la Vente</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {cancelModalSale.bonLivraisonNumber} · Client : {cancelModalSale.clientName}
                </p>
              </div>
            </div>

            <form onSubmit={handleCancelSale} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Motif de l'annulation *</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ex: Erreur de référence, retour complet chantier, commande annulée..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Attention :</strong> L'annulation réintégrera automatiquement les carreaux et articles dans les stocks et ajustera le solde du client.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Confirmer l'Annulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
