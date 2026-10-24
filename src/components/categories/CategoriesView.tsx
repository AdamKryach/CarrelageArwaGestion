import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Category } from '../../types';
import { Layers, Plus, Edit2, Trash2, X, CheckCircle2 } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultSalesUnit, setDefaultSalesUnit] = useState('pièce');
  const [errorMsg, setErrorMsg] = useState('');

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setDefaultSalesUnit('pièce');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setDefaultSalesUnit(cat.defaultSalesUnit || 'pièce');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, { name, description, defaultSalesUnit });
      } else {
        await api.createCategory({ name, description, defaultSalesUnit });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    try {
      await api.deleteCategory(cat.id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Catégories de Produits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organisation des rayons (Carrelage, Sanitaires, Robinetterie, Chauffe-eau, etc.)
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Catégorie</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Aucune catégorie pour le moment</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            La base de données est vierge. Créez vos premières catégories (ex: Carrelage, Sanitaires, Robinetterie, Chauffe-eau, Accessoires) pour organiser votre catalogue.
          </p>
          <button
            onClick={openCreate}
            className="mt-2 inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une première catégorie</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                    Unité: {cat.defaultSalesUnit}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.description || 'Aucune description fournie.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Chauffe-eau"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails des articles de ce rayon..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Unité de vente par défaut</label>
                <select
                  value={defaultSalesUnit}
                  onChange={(e) => setDefaultSalesUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="pièce">Pièce (pcs)</option>
                  <option value="m²">Mètre carré (m²)</option>
                  <option value="mètre">Mètre linéaire (m)</option>
                  <option value="sac">Sac</option>
                  <option value="lot">Lot</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
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
    </div>
  );
};
