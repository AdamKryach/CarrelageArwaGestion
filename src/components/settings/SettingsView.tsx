import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';
import { Settings, Save, CheckCircle2, AlertCircle, Building, Layers, Code2, ArrowRight } from 'lucide-react';

interface SettingsViewProps {
  onNavigateToDeveloper?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToDeveloper }) => {
  const { settings, setLocalSettings, user } = useAuth();
  const [form, setForm] = useState<StoreSettings>(settings || {} as StoreSettings);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      if (user?.role === 'developer') {
        const updated = await api.updateSettings(form);
        setLocalSettings(updated);
        setSuccessMsg('Paramètres du magasin enregistrés avec succès.');
      } else {
        setSuccessMsg('Paramètres consultés avec succès. Les modifications d’identité et de fiscalité sont gérées par le Développeur.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDev = user?.role === 'developer';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Paramètres du Magasin</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Préférences de vente carrelage, fiscalité, coordonnées et TVA.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
          <Settings className="w-5 h-5" />
        </div>
      </div>

      {isDev && onNavigateToDeveloper && (
        <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-4 rounded-xl text-white flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center space-x-2.5">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Vous êtes connecté en tant que <strong>Développeur</strong>. Vous avez accès au Developer Panel complet.</span>
          </div>
          <button
            onClick={onNavigateToDeveloper}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>Ouvrir Developer Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        {/* Store Business Info */}
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Building className="w-4 h-4 text-amber-600" />
            <span>Coordonnées & Raison Sociale</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Nom d'entreprise / Enseigne</label>
            <input
              type="text"
              readOnly={!isDev}
              value={form.businessName || ''}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg font-bold ${!isDev ? 'bg-slate-50 text-slate-700 border-slate-200' : 'border-slate-300'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ville</label>
              <input
                type="text"
                readOnly={!isDev}
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${!isDev ? 'bg-slate-50 text-slate-700 border-slate-200' : 'border-slate-300'}`}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pays</label>
              <input
                type="text"
                readOnly={!isDev}
                value={form.country || 'Maroc'}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${!isDev ? 'bg-slate-50 text-slate-700 border-slate-200' : 'border-slate-300'}`}
              />
            </div>
          </div>
        </div>

        {/* Moroccan Commercial Identifiers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">ICE</label>
            {isDev ? (
              <input
                type="text"
                value={form.ice || ''}
                onChange={(e) => setForm({ ...form, ice: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900">{form.ice}</span>
            )}
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">I.F.</label>
            {isDev ? (
              <input
                type="text"
                value={form.ifCode || ''}
                onChange={(e) => setForm({ ...form, ifCode: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900">{form.ifCode}</span>
            )}
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">PATENTE</label>
            {isDev ? (
              <input
                type="text"
                value={form.patente || ''}
                onChange={(e) => setForm({ ...form, patente: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900">{form.patente}</span>
            )}
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">CNSS</label>
            {isDev ? (
              <input
                type="text"
                value={form.cnss || ''}
                onChange={(e) => setForm({ ...form, cnss: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900">{form.cnss}</span>
            )}
          </div>
        </div>

        {/* Carrelage Policy & Printing Defaults */}
        <div className="border-b border-slate-100 pb-3 pt-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Règles de Gestion Carrelage & TVA</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Politique de Vente Carrelage
            </label>
            <select
              disabled={!isDev}
              value={form.carrelagePolicy || 'exact_tile'}
              onChange={(e) => setForm({ ...form, carrelagePolicy: e.target.value as any })}
              className={`w-full px-3 py-2 border rounded-lg bg-white ${!isDev ? 'bg-slate-50 text-slate-700' : 'border-slate-300'}`}
            >
              <option value="exact_tile">Vente au m² exact (avec ouverture de carton)</option>
              <option value="complete_box_only">Vente par cartons complets uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Taux de TVA standard (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              readOnly={!isDev}
              value={form.defaultTvaRate !== undefined ? form.defaultTvaRate : 20}
              onChange={(e) => setForm({ ...form, defaultTvaRate: parseFloat(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${!isDev ? 'bg-slate-50 text-slate-700 border-slate-200' : 'border-slate-300'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Prochain Bon de Livraison :</span>
            <span className="font-bold text-amber-900">BL-2026-{form.nextBlNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Prochaine Facture :</span>
            <span className="font-bold text-amber-900">FAC-2026-{form.nextFactureNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Prochain Bon d'Achat :</span>
            <span className="font-bold text-amber-900">BA-2026-{form.nextPurchaseNumber}</span>
          </div>
        </div>

        {isDev && (
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Paramètres'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
