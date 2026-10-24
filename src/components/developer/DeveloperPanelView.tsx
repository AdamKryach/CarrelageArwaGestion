import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  StoreSettings,
  SectionPermissions,
  DocumentTemplate,
  AuditLog,
  PaperSize,
  PageOrientation
} from '../../types';
import {
  Code2,
  Building,
  Palette,
  Eye,
  Printer,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Download,
  Upload,
  Layers,
  Percent,
  Sliders,
  FileText,
  FileSpreadsheet
} from 'lucide-react';

export const DeveloperPanelView: React.FC = () => {
  const { settings, setLocalSettings, permissions, setLocalPermissions } = useAuth();
  const { theme, updateTheme, resetTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'identity' | 'theme' | 'permissions' | 'designer' | 'security' | 'backups'>('identity');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Identity & Sales Policy & Tax Form State
  const [identityForm, setIdentityForm] = useState<StoreSettings>(settings || {} as StoreSettings);

  // Theme Form State
  const [themeForm, setThemeForm] = useState(theme);

  // Permissions Form State
  const [permForm, setPermForm] = useState<SectionPermissions>(permissions || {} as SectionPermissions);

  // Document Designer State
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<'bon_livraison' | 'facture'>('bon_livraison');
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null);

  // Security Credentials Form State
  const [targetRole, setTargetRole] = useState<'admin' | 'developer'>('developer');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Backups & Audit State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [restoreJson, setRestoreJson] = useState('');

  useEffect(() => {
    if (settings) setIdentityForm(settings);
    if (permissions) setPermForm(permissions);
    loadTemplates();
  }, [settings, permissions]);

  const loadTemplates = async () => {
    try {
      const data = await api.getDocumentTemplates();
      setTemplates(data);
      const activeTpl = data.find((t) => t.type === selectedDocType) || data[0];
      if (activeTpl) {
        setCurrentTemplate(activeTpl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDocType = (type: 'bon_livraison' | 'facture') => {
    setSelectedDocType(type);
    const tpl = templates.find((t) => t.type === type);
    if (tpl) {
      setCurrentTemplate(tpl);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'backups') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // 1. Save Identity & Tax & Policy
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      const updated = await api.updateSettings(identityForm);
      setLocalSettings(updated);
      showSuccess('Paramètres d’identité, ville, fiscalité (TVA) et politiques de vente enregistrés avec succès.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Save Theme
  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateTheme(themeForm);
      showSuccess('Thème visuel et typographie appliqués avec succès.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’application du thème.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Save Permissions
  const handleSavePermissions = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const updated = await api.updatePermissions(permForm);
      setLocalPermissions(updated);
      showSuccess('Permissions d’accès de l’Admin mises à jour avec succès.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde des permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Save Template
  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      if (identityForm.logoUrl !== settings?.logoUrl) {
        const updatedSettings = await api.updateSettings({ logoUrl: identityForm.logoUrl });
        setLocalSettings(updatedSettings);
      }
      await api.updateDocumentTemplate(currentTemplate.id, currentTemplate);
      await loadTemplates();
      showSuccess(`Modèle de document "${currentTemplate.name}" mis à jour avec succès.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde du modèle.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner une image valide (PNG, JPG, WEBP ou SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Le logo ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIdentityForm((current) => ({ ...current, logoUrl: String(reader.result) }));
      setErrorMsg('');
    };
    reader.onerror = () => setErrorMsg('Impossible de lire ce fichier image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveLogo = () => {
    setIdentityForm((current) => ({ ...current, logoUrl: '' }));
  };

  // 5. Update Credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      await api.updateCredentials({
        targetRole,
        newUsername: newUsername.trim() || undefined,
        newName: newName.trim() || undefined,
        newPassword: newPassword || undefined,
      });
      showSuccess(`Identifiants pour le rôle "${targetRole}" modifiés avec succès.`);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la mise à jour des identifiants.');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Restore Database
  const handleRestoreDatabase = async () => {
    if (!restoreJson.trim()) return;
    if (!window.confirm('Attention : La restauration remplacera toutes les données actuelles par la sauvegarde. Continuer ?')) {
      return;
    }

    try {
      const parsed = JSON.parse(restoreJson);
      await api.restoreBackup(parsed);
      alert('Base de données restaurée avec succès ! La page va se recharger.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la restauration du fichier JSON.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-amber-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xl">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight text-white">Developer Panel</h2>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Accès Restreint Développeur
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Personnalisation de l'enseigne, ville, TVA, politique de vente et designer complet des Factures & Bons de Livraison.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-4 border-t border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'identity' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Identité, Ville, TVA & Politiques</span>
          </button>

          <button
            onClick={() => setActiveTab('designer')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'designer' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Design Facture & Bon de Livraison</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'theme' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Thème & Couleurs</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'permissions' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visibilité Sections Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'security' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sécurité & Comptes</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'backups' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sauvegardes & Journal Audit</span>
          </button>
        </div>
      </div>

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

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: IDENTITÉ, VILLE, FISCALITÉ & POLITIQUES DE VENTE      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveIdentity} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Identité Commerciale & Mentions Légales Maroc</h3>
            <p className="text-slate-500 text-xs">
              Ces paramètres définissent la raison sociale, l'adresse, la ville, les identifiants fiscaux et les règles de vente dans toute l'application.
            </p>
          </div>

          {/* Business Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nom d'Entreprise / Raison Sociale *
              </label>
              <input
                type="text"
                required
                value={identityForm.businessName || ''}
                onChange={(e) => setIdentityForm({ ...identityForm, businessName: e.target.value })}
                placeholder="ex: Carrelage & Sanitaire Arwa SARL"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nom de l'Application (Affichage Interface)
              </label>
              <input
                type="text"
                required
                value={identityForm.appName || ''}
                onChange={(e) => setIdentityForm({ ...identityForm, appName: e.target.value })}
                placeholder="ex: CarrelageArwa"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Location: Ville & Pays & Adresse */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs block">Localisation & Coordonnées</span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ville (Maroc) *</label>
                <input
                  type="text"
                  required
                  value={identityForm.city || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, city: e.target.value })}
                  placeholder="ex: Casablanca"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pays *</label>
                <input
                  type="text"
                  required
                  value={identityForm.country || 'Maroc'}
                  onChange={(e) => setIdentityForm({ ...identityForm, country: e.target.value })}
                  placeholder="ex: Maroc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Devise du Magasin *</label>
                <input
                  type="text"
                  required
                  value={identityForm.currency || 'DH'}
                  onChange={(e) => setIdentityForm({ ...identityForm, currency: e.target.value })}
                  placeholder="DH ou MAD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adresse Magasin / Showroom</label>
                <input
                  type="text"
                  value={identityForm.address || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, address: e.target.value })}
                  placeholder="ex: Bd Al Qods, Sidi Bernoussi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Téléphone(s) Showroom</label>
                <input
                  type="text"
                  value={identityForm.phone || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, phone: e.target.value })}
                  placeholder="ex: +212 5 22 75 40 10 / +212 6 61 98 45 22"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Moroccan Tax & Legal Identifiers: ICE, N° Patente, CNSS, IF, RC */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-3">
            <span className="font-bold text-amber-900 text-xs block">
              Identifiants Commerciaux & Fiscaux Officiels (Maroc)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ICE (Identifiant Commun de l'Entreprise) *</label>
                <input
                  type="text"
                  required
                  value={identityForm.ice || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, ice: e.target.value })}
                  placeholder="15 chiffres (ex: 002847593000041)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">N° Patente *</label>
                <input
                  type="text"
                  required
                  value={identityForm.patente || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, patente: e.target.value })}
                  placeholder="ex: 37920145"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">N° CNSS *</label>
                <input
                  type="text"
                  required
                  value={identityForm.cnss || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, cnss: e.target.value })}
                  placeholder="ex: 7829410"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Identifiant Fiscal (I.F.)</label>
                <input
                  type="text"
                  value={identityForm.ifCode || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, ifCode: e.target.value })}
                  placeholder="ex: 45892147"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Registre de Commerce (R.C.)</label>
                <input
                  type="text"
                  value={identityForm.rc || ''}
                  onChange={(e) => setIdentityForm({ ...identityForm, rc: e.target.value })}
                  placeholder="ex: 341908 Casablanca"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Sales Policies & TVA Rate */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs block flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-amber-600" />
              <span>Fiscalité (Taux de TVA) & Politiques de Vente</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Taux de TVA par défaut (%) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  required
                  value={identityForm.defaultTvaRate !== undefined ? identityForm.defaultTvaRate : 20}
                  onChange={(e) => setIdentityForm({ ...identityForm, defaultTvaRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Taux standard Maroc : 20%</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Politique de Vente Carrelage *</label>
                <select
                  value={identityForm.carrelagePolicy || 'exact_tile'}
                  onChange={(e) => setIdentityForm({ ...identityForm, carrelagePolicy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="exact_tile">
                    Vente au m² exact (avec ouverture de carton et carreaux au détail)
                  </option>
                  <option value="complete_box_only">
                    Vente par cartons complets uniquement (arrondi au carton supérieur)
                  </option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Détermine si le point de vente autorise l'ouverture de cartons ou impose des cartons pleins.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={identityForm.allowNegativeStock || false}
                  onChange={(e) => setIdentityForm({ ...identityForm, allowNegativeStock: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-800">
                  Autoriser la validation des ventes même en cas de stock négatif
                </span>
              </label>
            </div>
          </div>

          {/* Legal Notice */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Clause Juridique & Mentions Légales par défaut (Pied de Facture & Bon de Livraison)
            </label>
            <textarea
              rows={2}
              value={identityForm.receiptFooterLegalText || ''}
              onChange={(e) => setIdentityForm({ ...identityForm, receiptFooterLegalText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg italic"
              placeholder="ex: Les marchandises vendues ne seront ni reprises ni échangées..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: DESIGNER VISUEL DE LA FACTURE & DU BON DE LIVRAISON   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'designer' && currentTemplate && (
        <div className="space-y-4">
          {/* Document Switcher Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Personnalisation Graphique & Impression des Documents
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configurez le design du <span className="font-bold">Bon de Livraison</span> et de la <span className="font-bold">Facture</span> séparément.
                </p>
              </div>
            </div>

            {/* Document Type Toggle Buttons */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => handleSelectDocType('bon_livraison')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                    selectedDocType === 'bon_livraison'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bon de Livraison</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDocType('facture')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                    selectedDocType === 'facture'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Facture</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Enregistrer ce Design</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* DESIGNER CONTROLS PANEL (5 COLS) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Paramètres : {currentTemplate.name}
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">
                  {currentTemplate.type.replace('_', ' ')}
                </span>
              </div>

              {/* Title and Paper Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Titre du Document</label>
                  <input
                    type="text"
                    value={currentTemplate.title}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Format Papier</label>
                  <select
                    value={currentTemplate.paperSize}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, paperSize: e.target.value as PaperSize })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="A5">A5 (Standard Magasin)</option>
                    <option value="A4">A4 (Grand Format)</option>
                    <option value="A6">A6 (Petit Format)</option>
                    <option value="80mm">80mm (Ticket Thermique)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Orientation</label>
                  <select
                    value={currentTemplate.orientation}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, orientation: e.target.value as PageOrientation })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Paysage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Marges (mm)</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={currentTemplate.marginsMm !== undefined ? currentTemplate.marginsMm : 8}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, marginsMm: parseInt(e.target.value) || 8 })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Police (pt)</label>
                  <input
                    type="number"
                    min="8"
                    max="14"
                    value={currentTemplate.fontSize || 10}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, fontSize: parseInt(e.target.value) || 10 })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div>
                  <span className="font-bold text-slate-700 block">Logo Facture & Bon de Livraison</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ce logo est utilisé sur les deux documents. Enregistrez le design pour l'appliquer.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
                    {identityForm.logoUrl ? (
                      <img src={identityForm.logoUrl} alt="Aperçu du logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <span className="text-[9px] text-slate-400 text-center px-1">Aucun logo</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-white font-bold cursor-pointer hover:bg-slate-800">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer un logo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {identityForm.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-2 font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        Retirer le logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Couleur Badge En-tête
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={currentTemplate.headerColor || '#b45309'}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, headerColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTemplate.headerColor || '#b45309'}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, headerColor: e.target.value })}
                      className="w-20 px-1.5 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Fond En-tête Tableau
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={currentTemplate.tableHeaderBg || '#f1f5f9'}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, tableHeaderBg: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTemplate.tableHeaderBg || '#f1f5f9'}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, tableHeaderBg: e.target.value })}
                      className="w-20 px-1.5 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Layout Elements Toggles */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700 block">Visibilité des Blocs du Document</span>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showLogo}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showLogo: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Afficher le Logo</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showCompanyDetails}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showCompanyDetails: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Coordonnées Magasin</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showClientBox}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showClientBox: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Encadré Client</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showPrices}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showPrices: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span className="font-semibold text-amber-900">Afficher Prix & Totaux</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showTaxDetails}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showTaxDetails: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Ligne TVA</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentTemplate.showSignatures}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, showSignatures: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Cadre Signatures</span>
                  </label>
                </div>
              </div>

              {/* Signatures Labels */}
              {currentTemplate.showSignatures && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Libellé Signature Client</label>
                    <input
                      type="text"
                      value={currentTemplate.signatureClientLabel || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, signatureClientLabel: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Libellé Signature Direction</label>
                    <input
                      type="text"
                      value={currentTemplate.signatureVendeurLabel || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, signatureVendeurLabel: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Table Column Customizer */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700 block">Personnalisation des Colonnes du Tableau</span>

                <div className="space-y-1.5">
                  {currentTemplate.columns.map((col, idx) => (
                    <div key={col.id} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={(e) => {
                          const copy = [...currentTemplate.columns];
                          copy[idx].visible = e.target.checked;
                          setCurrentTemplate({ ...currentTemplate, columns: copy });
                        }}
                        className="rounded text-amber-600 focus:ring-0"
                      />
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => {
                          const copy = [...currentTemplate.columns];
                          copy[idx].label = e.target.value;
                          setCurrentTemplate({ ...currentTemplate, columns: copy });
                        }}
                        className="flex-1 px-2 py-0.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{col.key}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Notice */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTemplate.showLegalNotice}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, showLegalNotice: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span className="font-bold text-slate-700">Afficher la Clause Juridique sur ce Document</span>
                </label>

                {currentTemplate.showLegalNotice && (
                  <textarea
                    rows={2}
                    value={currentTemplate.legalNoticeText || ''}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, legalNoticeText: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs italic bg-white"
                  />
                )}
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-200/80 p-6 rounded-2xl border border-slate-300 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-wider flex items-center space-x-1">
                <span>Aperçu Interactif : {currentTemplate.title} ({currentTemplate.paperSize})</span>
              </span>

              {/* Scaled Preview Sheet */}
              <div
                className="w-[148mm] min-h-[210mm] bg-white shadow-xl rounded-sm text-slate-900 flex flex-col justify-between leading-tight border border-slate-300"
                style={{
                  padding: `${currentTemplate.marginsMm !== undefined ? currentTemplate.marginsMm : 8}mm`,
                  fontSize: `${currentTemplate.fontSize || 10}px`,
                }}
              >
                {selectedDocType === 'bon_livraison' ? (
                  /* BON DE LIVRAISON PREVIEW : EXACT UPLOADED FORMAT */
                  <div className="flex flex-col justify-between h-full space-y-3 font-sans text-black">
                    <div>
                      {/* Top Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2.5 max-w-[62%]">
                          {currentTemplate.showLogo && (
                            identityForm.logoUrl ? (
                              <img src={identityForm.logoUrl} alt="Logo" className="w-12 h-12 shrink-0 object-contain" />
                            ) : (
                              <svg viewBox="0 0 100 100" className="w-12 h-12 shrink-0" fill="none">
                                <rect width="100" height="100" rx="10" fill="#f0fdfa" />
                                <path d="M50 12 C 30 12, 12 30, 12 50 C 12 38, 28 28, 42 35 C 48 38, 50 44, 50 50 Z" fill="#0284c7" />
                                <path d="M88 50 C 88 30, 70 12, 50 12 C 62 12, 72 28, 65 42 C 62 48, 56 50, 50 50 Z" fill="#0d9488" />
                                <path d="M50 88 C 70 88, 88 70, 88 50 C 88 62, 72 72, 58 65 C 52 62, 50 56, 50 50 Z" fill="#0369a1" />
                                <path d="M12 50 C 12 70, 30 88, 50 88 C 38 88, 28 72, 35 58 C 38 52, 44 50, 50 50 Z" fill="#0f766e" />
                                <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0891b2" strokeWidth="3" />
                                <circle cx="50" cy="50" r="6" fill="#0284c7" />
                              </svg>
                            )
                          )}

                          <div className="flex-1">
                            <div className="font-black text-sm uppercase tracking-wide text-black">
                              {identityForm.businessName || 'CARRELAGE ARWA'}
                            </div>
                            <div className="w-full h-0.5 bg-black my-0.5" />
                            <div className="text-[8.5px] text-black leading-tight space-y-0.5">
                              <div>{identityForm.address || 'Boulevard Ahmed Ben Hmad Dighoussi'}</div>
                              <div>2 Bis Lot Ratbia Zitoune {identityForm.city || 'Meknes'}</div>
                              <div>Gsm : {identityForm.phone || '0671152615'}</div>
                              <div>ICE : {identityForm.ice || '004027096000073'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Right Client Box */}
                        <div className="border border-black p-2 w-44 min-h-[65px] text-[8.5px]">
                          <div className="font-bold text-black text-[9.5px] mb-0.5">Client :</div>
                          <div className="font-bold text-black text-[9px]">M. Karim Bennani</div>
                          <div className="text-black">Tél : 0663123456</div>
                          <div className="text-black">Chantier Villa 12, Meknès</div>
                        </div>
                      </div>

                      {/* Middle Date & BL Box + Title */}
                      <div className="flex justify-between items-end mb-1">
                        <div className="border border-black p-1.5 w-40 text-[8.5px] leading-tight">
                          <div className="font-bold text-black">Date :</div>
                          <div className="font-bold text-black text-[8px]">07/10/2026</div>
                          <div className="font-bold text-black text-[8px] mt-0.5">
                            N° Bon de Livraison : <span className="font-mono">0000004</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-black">Bon de Livraison</div>
                        </div>
                      </div>

                      <div className="w-full h-0.5 bg-black mb-2" />

                      {/* Products Table with exact columns from uploaded file */}
                      <table className="w-full border-collapse border border-black text-[8.5px]">
                        <thead>
                          <tr className="border-b border-black text-black font-bold">
                            <th className="border border-black p-1 text-center w-[12%]">Quantité</th>
                            <th className="border border-black p-1 text-center w-[44%]">Désignation</th>
                            <th className="border border-black p-1 text-center w-[11%]">Caisse</th>
                            <th className="border border-black p-1 text-center w-[11%]">Carr.</th>
                            <th className="border border-black p-1 text-center w-[11%]">Prix. U</th>
                            <th className="border border-black p-1 text-center w-[11%]">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-black text-black">
                            <td className="border border-black p-1 text-center font-mono">10</td>
                            <td className="border border-black p-1 text-center">
                              <div className="font-medium">carrelage gold</div>
                              <div className="text-[7.5px] text-slate-700">Réf. 66666 · 60x60</div>
                            </td>
                            <td className="border border-black p-1 text-center font-mono">8</td>
                            <td className="border border-black p-1 text-center font-mono">40</td>
                            <td className="border border-black p-1 text-center font-mono">65,00</td>
                            <td className="border border-black p-1 text-center font-mono font-bold">650,00</td>
                          </tr>
                          {/* Blank filler rows */}
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <tr key={idx} className="border-b border-black h-5">
                              <td className="border border-black p-1">&nbsp;</td>
                              <td className="border border-black p-1">&nbsp;</td>
                              <td className="border border-black p-1">&nbsp;</td>
                              <td className="border border-black p-1">&nbsp;</td>
                              <td className="border border-black p-1">&nbsp;</td>
                              <td className="border border-black p-1">&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Net à Payer Box */}
                      <div className="border border-black flex justify-between items-center py-1.5 px-4 mt-2">
                        <span className="font-bold text-xs text-black">Net à Payer</span>
                        <span className="font-black text-sm font-mono text-black">650,00 {identityForm.currency || 'DH'}</span>
                      </div>
                    </div>

                    {/* Centered Legal Notice */}
                    <div className="text-center text-[7.5px] italic text-slate-700 pt-2 font-serif leading-tight">
                      {identityForm.receiptFooterLegalText || 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.'}
                    </div>
                  </div>
                ) : (
                  /* FACTURE PREVIEW : DEVELOPER PORTAL CUSTOMIZABLE FORMAT */
                  <div>
                    {/* Header Preview */}
                    <div className="flex justify-between items-start border-b border-slate-300 pb-2 mb-2">
                      <div className="space-y-0.5 max-w-[60%]">
                        <div className="flex items-center space-x-2">
                          {currentTemplate.showLogo && (
                            identityForm.logoUrl ? (
                              <img src={identityForm.logoUrl} alt="Logo" className="w-7 h-7 object-contain shrink-0" />
                            ) : (
                              <div
                                className="w-7 h-7 rounded text-white font-bold flex items-center justify-center text-xs shadow-xs"
                                style={{ backgroundColor: currentTemplate.headerColor || '#0f172a' }}
                              >
                                CA
                              </div>
                            )
                          )}
                          <div>
                            <div className="font-extrabold text-xs uppercase">
                              {identityForm.businessName || 'CARRELAGE ARWA'}
                            </div>
                            <div className="text-[8.5px] text-slate-500 font-medium">Carrelage · Sanitaires · Robinetterie · Chauffe-eau</div>
                          </div>
                        </div>

                        <div className="text-[8.5px] text-slate-600">
                          {identityForm.address || 'Boulevard Ahmed Ben Hmad Dighoussi'}, {identityForm.city || 'Meknes'} · {identityForm.country || 'Maroc'}
                        </div>
                        <div className="text-[8.5px] text-slate-600 font-mono">
                          Tél : {identityForm.phone || '0671152615'}
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div
                          className="text-white font-black px-2 py-0.5 rounded text-[10px] uppercase inline-block shadow-2xs"
                          style={{ backgroundColor: currentTemplate.headerColor || '#0f172a' }}
                        >
                          {currentTemplate.title || 'FACTURE'}
                        </div>
                        <div className="font-mono font-bold text-[10px]" style={{ color: currentTemplate.headerColor || '#0f172a' }}>
                          N° Facture : 0000004
                        </div>
                        <div className="text-[9px] text-slate-600">Date : 07/10/2026</div>
                      </div>
                    </div>

                    {/* Client & Identifiers */}
                    <div className="grid grid-cols-2 gap-2 mb-2 text-[8.5px]">
                      <div className="border border-slate-300 p-1.5 rounded bg-slate-50/50">
                        <div className="font-bold text-slate-700 uppercase text-[8px] mb-0.5">Destinataire / Client</div>
                        <div className="font-bold text-slate-900 text-[9.5px]">M. Karim Bennani</div>
                        <div className="text-slate-600">Tél : +212 6 63 12 34 56</div>
                        <div className="text-slate-600">Chantier Villa 12, Meknès</div>
                      </div>

                      <div className="border border-slate-300 p-1.5 rounded bg-slate-50/50 font-mono text-[8px] space-y-0.5">
                        <div className="font-sans font-bold text-slate-700 uppercase text-[8px] mb-0.5">Identifiants Entreprise</div>
                        <div className="flex justify-between"><span>ICE :</span><span className="font-semibold">{identityForm.ice || '004027096000073'}</span></div>
                        <div className="flex justify-between"><span>I.F. :</span><span className="font-semibold">{identityForm.ifCode || '45892147'}</span></div>
                        <div className="flex justify-between"><span>Patente :</span><span className="font-semibold">{identityForm.patente || '37920145'}</span></div>
                        <div className="flex justify-between"><span>CNSS :</span><span className="font-semibold">{identityForm.cnss || '7829410'}</span></div>
                        <div className="flex justify-between"><span>Ville :</span><span className="font-semibold font-sans">{identityForm.city || 'Meknes'}</span></div>
                      </div>
                    </div>

                    {/* Product Table Preview */}
                    <div className="border border-slate-300 rounded overflow-hidden mb-2">
                      <table className="w-full border-collapse text-left text-[8.5px]">
                        <thead>
                          <tr
                            className="border-b border-slate-300 font-bold uppercase text-[8px]"
                            style={{ backgroundColor: currentTemplate.tableHeaderBg || '#f1f5f9' }}
                          >
                            <th className="py-1 px-1.5 border-r border-slate-300">Désignation</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-center">Quantité</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-center">Caisse</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-center">Carreaux</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-right">Prix U</th>
                            <th className="py-1 px-1.5 text-right">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="py-1 px-1.5 font-medium">carrelage gold 60x60</td>
                            <td className="py-1 px-1.5 text-center font-mono">10.00 m²</td>
                            <td className="py-1 px-1.5 text-center font-mono">8</td>
                            <td className="py-1 px-1.5 text-center font-mono">40</td>
                            <td className="py-1 px-1.5 text-right font-mono">65.00</td>
                            <td className="py-1 px-1.5 text-right font-mono font-bold">650.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Preview */}
                    <div className="flex justify-end mb-2">
                      <div className="w-[50%] border border-slate-300 p-2 rounded bg-slate-50 text-[8.5px] font-mono space-y-0.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Total HT :</span>
                          <span>541.67 {identityForm.currency || 'DH'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>TVA ({identityForm.defaultTvaRate || 20}%) :</span>
                          <span>108.33 {identityForm.currency || 'DH'}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[10px] border-t border-slate-300 pt-0.5 text-slate-900">
                          <span>Net à Payer (TTC) :</span>
                          <span style={{ color: currentTemplate.headerColor || '#0f172a' }}>
                            650.00 {identityForm.currency || 'DH'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Signatures */}
                    <div className="grid grid-cols-2 gap-2 text-[8px] text-center pt-1 border-t border-slate-300 mb-1">
                      <div className="border border-dashed border-slate-300 rounded p-1 h-10 flex flex-col justify-between">
                        <span className="font-semibold text-slate-700">Visa & Bon pour accord Client</span>
                        <span className="text-[7px] text-slate-400">Signature</span>
                      </div>
                      <div className="border border-dashed border-slate-300 rounded p-1 h-10 flex flex-col justify-between">
                        <span className="font-semibold text-slate-700">Cachet & Signature La Direction</span>
                        <span className="text-[7px] text-slate-400">Pour {identityForm.businessName || 'CARRELAGE ARWA'}</span>
                      </div>
                    </div>

                    {/* Legal Clause */}
                    <div className="text-[7.5px] italic text-slate-600 leading-tight border-t border-slate-100 pt-1 text-center font-serif">
                      "{identityForm.receiptFooterLegalText || 'Les marchandises vendues ne seront ni reprises ni échangées...'}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: THÈME & COULEURS                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'theme' && (
        <form onSubmit={handleSaveTheme} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personnalisation Visuelle & Typographique</h3>
              <p className="text-slate-500 text-xs">
                Modifiez la palette de marque du magasin, la police et la densité d'affichage.
              </p>
            </div>
            <button
              type="button"
              onClick={resetTheme}
              className="text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser par défaut</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Couleur Primaire</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={themeForm.primaryColor}
                  onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={themeForm.primaryColor}
                  onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                  className="w-28 px-2 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Couleur d'Accent</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={themeForm.accentColor}
                  onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={themeForm.accentColor}
                  onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                  className="w-28 px-2 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Police de Caractères</label>
              <select
                value={themeForm.fontFamily}
                onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Recommandé Luxe/Moderne)</option>
                <option value="Inter">Inter (Précision)</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="sans-serif">Système Sans-Serif</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Appliquer le Thème</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: VISIBILITÉ DES SECTIONS ADMIN                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'permissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Contrôle d'Accès du Compte Administrateur</h3>
            <p className="text-slate-500 text-xs">
              Activez ou désactivez les modules accessibles par l'Admin. Lorsqu'un module est désactivé, l'accès à son interface et ses points d'API backend est immédiatement révoqué pour l'Admin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(permForm).map((key) => {
              const k = key as keyof SectionPermissions;
              const isEnabled = permForm[k];

              const labels: Record<string, string> = {
                dashboard: 'Tableau de bord',
                pos: 'Vente & Caisse (POS)',
                products: 'Catalogue Produits & Carrelage',
                categories: 'Gestion des Catégories',
                inventory: 'Stock & Mouvements',
                purchases: 'Achats Fournisseurs',
                suppliers: 'Fournisseurs',
                supplierPayments: 'Paiements Fournisseurs',
                clients: 'Clients & Soldes',
                invoices: 'Factures',
                deliveryNotes: 'Bons de Livraison',
                reports: 'Rapports & Finances',
                printConfig: 'Configuration Impression',
                settings: 'Paramètres Généraux',
              };

              return (
                <label
                  key={key}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isEnabled
                      ? 'bg-amber-50/50 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{labels[key] || key}</span>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setPermForm({ ...permForm, [k]: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                </label>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Permissions'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: SÉCURITÉ & COMPTES                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <form onSubmit={handleUpdateCredentials} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs max-w-xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Gestion des Identifiants & Accès Sécurisés</h3>
            <p className="text-slate-500 text-xs">
              Modifiez le mot de passe du compte Développeur ou réinitialisez le compte Administrateur en toute confidentialité.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Compte Cible</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
            >
              <option value="developer">Compte Développeur</option>
              <option value="admin">Compte Administrateur</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nouvel Identifiant (Optionnel)</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Laisser vide pour ne pas changer"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nom affiché</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ex: M. Zitoune ou Adam"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nouveau Mot de Passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 5 caractères"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
            >
              Mettre à jour les identifiants
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: SAUVEGARDES & JOURNAL D'AUDIT                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'backups' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Sauvegarde Complète (Export JSON)</h3>
              </div>
              <p className="text-slate-500">
                Téléchargez l'intégralité de la base de données (produits, stocks, carrelage, ventes, fournisseurs, factures) en un fichier JSON horodaté.
              </p>
              <a
                href="/api/developer/backup"
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la Sauvegarde JSON</span>
              </a>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Restauration depuis JSON</h3>
              </div>
              <p className="text-slate-500">
                Collez les données JSON d'une sauvegarde pour restaurer l'état complet du magasin.
              </p>
              <textarea
                rows={3}
                placeholder="Coller le contenu JSON de sauvegarde ici..."
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
              <button
                onClick={handleRestoreDatabase}
                disabled={!restoreJson.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
              >
                Restaurer les Données
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Piste d'Audit & Journal des Événements Système</h3>
              <span className="font-mono text-slate-500">{auditLogs.length} événements tracés</span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[9.5px]">
                  <tr>
                    <th className="py-2.5 px-3">Date & Heure</th>
                    <th className="py-2.5 px-2">Utilisateur</th>
                    <th className="py-2.5 px-2">Action</th>
                    <th className="py-2.5 px-2">Entité</th>
                    <th className="py-2.5 px-3">Détails de l'opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {log.timestamp.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2 px-2 font-bold text-slate-800 font-sans">
                        {log.userName} ({log.userRole})
                      </td>
                      <td className="py-2 px-2 font-bold text-amber-800">{log.action}</td>
                      <td className="py-2 px-2 text-slate-600">{log.entity}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
