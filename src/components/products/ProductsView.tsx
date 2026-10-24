import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product, Category, Supplier, StoreSettings } from '../../types';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  Boxes,
  Layers,
  AlertTriangle,
  X,
  Check,
  Calculator,
  RefreshCw
} from 'lucide-react';

interface ProductsViewProps {
  settings: StoreSettings;
  initialFilter?: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ settings, initialFilter }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState(initialFilter || 'all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [designation, setDesignation] = useState('');
  const [reference, setReference] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [origin, setOrigin] = useState<'local' | 'importation'>('local');
  const [productType, setProductType] = useState<'carrelage' | 'piece'>('carrelage');
  const [description, setDescription] = useState('');
  const [prixAchat, setPrixAchat] = useState<number>(0);
  const [prixVente, setPrixVente] = useState<number>(0);
  const [stockInitial, setStockInitial] = useState<number>(0);
  const [stockMin, setStockMin] = useState<number>(5);
  const [supplierId, setSupplierId] = useState('');
  const [barcode, setBarcode] = useState('');

  // Carrelage Dimensions & Price basis
  const [lengthCm, setLengthCm] = useState<number>(19);
  const [widthCm, setWidthCm] = useState<number>(57);
  const [tilesPerBox, setTilesPerBox] = useState<number>(10);
  const [priceBasis, setPriceBasis] = useState<'m2' | 'caisse'>('m2');

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, sups] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(sups);
      if (cats.length && !categoryId) setCategoryId(cats[0].id);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setDesignation('');
    setReference('');
    setCategoryId(categories[0]?.id || '');
    setOrigin('local');
    setProductType('carrelage');
    setDescription('');
    setPrixAchat(0);
    setPrixVente(0);
    setStockInitial(0);
    setStockMin(5);
    setSupplierId('');
    setBarcode('');
    setLengthCm(19);
    setWidthCm(57);
    setTilesPerBox(10);
    setPriceBasis('m2');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setDesignation(prod.designation);
    setReference(prod.reference);
    setCategoryId(prod.categoryId);
    setOrigin(prod.origin || 'local');
    setProductType(prod.productType as any);
    setDescription(prod.description || '');
    setPrixAchat(prod.prixAchat);
    setPrixVente(prod.prixVente);
    setStockInitial(prod.stockQuantity);
    setStockMin(prod.stockMin);
    setSupplierId(prod.supplierId || '');
    setBarcode(prod.barcode || '');

    if (prod.productType === 'carrelage' && prod.carrelageDetails) {
      setLengthCm(prod.carrelageDetails.lengthCm);
      setWidthCm(prod.carrelageDetails.widthCm);
      setTilesPerBox(prod.carrelageDetails.tilesPerBox);
      setPriceBasis(prod.carrelageDetails.priceBasis || 'm2');
    }

    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Live computed surface math for Carrelage
  const surfacePerTile = (lengthCm * widthCm) / 10000;
  const surfacePerBox = surfacePerTile * tilesPerBox;
  const calculatedTotalTiles = productType === 'carrelage' ? stockInitial * tilesPerBox : stockInitial;
  const calculatedTotalM2 = calculatedTotalTiles * surfacePerTile;

  // Price conversion preview
  const previewPurchasePerBox = priceBasis === 'm2' ? (prixAchat * surfacePerBox) : prixAchat;
  const previewSellingPerBox = priceBasis === 'm2' ? (prixVente * surfacePerBox) : prixVente;
  const previewPurchasePerM2 = priceBasis === 'caisse' ? (surfacePerBox > 0 ? prixAchat / surfacePerBox : 0) : prixAchat;
  const previewSellingPerM2 = priceBasis === 'caisse' ? (surfacePerBox > 0 ? prixVente / surfacePerBox : 0) : prixVente;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

    try {
      const payload: any = {
        designation,
        reference,
        categoryId,
        origin,
        productType,
        description,
        prixAchat: Number(prixAchat),
        prixVente: Number(prixVente),
        stockInitial: Number(stockInitial),
        stockMin: Number(stockMin),
        supplierId: supplierId || undefined,
        barcode: barcode || undefined,
      };

      if (productType === 'carrelage') {
        payload.lengthCm = Number(lengthCm);
        payload.widthCm = Number(widthCm);
        payload.tilesPerBox = Number(tilesPerBox);
        payload.priceBasis = priceBasis;
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsModalOpen(false);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement du produit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (prod: Product) => {
    if (!window.confirm(`Confirmer l'archivage sécurisé du produit "${prod.designation}" ? Son historique de ventes restera intact.`)) {
      return;
    }
    try {
      await api.deleteProduct(prod.id);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’archivage.');
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

    // Sous-famille / Origine
    const origin = p.origin || 'local';
    if (originFilter !== 'all' && origin !== originFilter) return false;

    // Stock Filter
    if (stockFilter === 'low' && (p.stockQuantity > p.stockMin || p.stockQuantity <= 0)) return false;
    if (stockFilter === 'out' && p.stockQuantity > 0) return false;
    if (stockFilter === 'positive' && p.stockQuantity <= 0) return false;

    if (!search.trim()) return true;
    const tokens = search.toLowerCase().split(/\s+/);
    const cat = categories.find((c) => c.id === p.categoryId);
    const fullText = `${p.designation} ${p.reference} ${p.barcode || ''} ${origin} ${cat?.name || ''} ${
      p.carrelageDetails ? `${p.carrelageDetails.lengthCm}*${p.carrelageDetails.widthCm}` : ''
    }`.toLowerCase();
    return tokens.every((t) => fullText.includes(t));
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Catalogue Produits & Carrelage</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des carreaux au carton/détail, sanitaires, robinetterie et chauffe-eau.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher désignation, réf (2207), dimension (19*57)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category (Famille) Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 font-medium bg-white"
          >
            <option value="all">Toutes les familles ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Sous-famille / Origine Filter */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 font-medium bg-white"
          >
            <option value="all">Toutes les sous-familles</option>
            <option value="local">🇲🇦 Local (Maroc)</option>
            <option value="importation">🌐 Importation (Étranger)</option>
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 font-medium bg-white"
          >
            <option value="all">Tous les stocks</option>
            <option value="positive">✓ Stock positif (En stock)</option>
            <option value="out">⚠ Stock négatif (Rupture)</option>
            <option value="low">⚡ Stock bas (Alerte)</option>
          </select>

          <button
            onClick={loadAll}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Désignation</th>
                <th className="py-3 px-3">Réf / Code</th>
                <th className="py-3 px-3">Famille & Origine</th>
                <th className="py-3 px-3 text-right">Prix Achat</th>
                <th className="py-3 px-3 text-right">Prix Vente</th>
                <th className="py-3 px-3 text-center">Stock Disponible</th>
                <th className="py-3 px-3 text-center">État Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun produit trouvé avec ces critères de recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isCarrelage = prod.productType === 'carrelage' && prod.carrelageDetails;
                  const isLow = prod.stockQuantity <= prod.stockMin && prod.stockQuantity > 0;
                  const isOut = prod.stockQuantity <= 0;
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  const prodOrigin = prod.origin || 'local';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.designation}</div>
                        {isCarrelage && (
                          <div className="text-[10px] text-slate-500">
                            Dim: <span className="font-semibold">{prod.carrelageDetails?.lengthCm}x{prod.carrelageDetails?.widthCm} cm</span> ·{' '}
                            {prod.carrelageDetails?.tilesPerBox} carreaux/caisse ({prod.carrelageDetails?.surfacePerBox} m²)
                          </div>
                        )}
                        {prod.description && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{prod.description}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-amber-800">
                        {prod.reference}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {cat?.name || 'Divers'}
                          </span>
                          {prodOrigin === 'importation' ? (
                            <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                              <span>🌐</span> Importation
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                              <span>🇲🇦</span> Local
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {prod.prixAchat.toFixed(2)} {settings.currency}
                        {isCarrelage && <span className="text-[9.5px] text-slate-400 block font-sans">/ m²</span>}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {prod.prixVente.toFixed(2)} {settings.currency}
                        {isCarrelage && <span className="text-[9.5px] text-slate-400 block font-sans">/ m²</span>}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        {isCarrelage ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              {prod.carrelageDetails?.boxesInStock} caisses
                              {prod.carrelageDetails && prod.carrelageDetails.looseTilesInStock > 0 && ` +${prod.carrelageDetails.looseTilesInStock} car.`}
                            </div>
                            <div className="text-[10px] text-amber-700 font-semibold">
                              {prod.carrelageDetails?.totalSurfaceM2} m²
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800">{prod.stockQuantity} pcs</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Rupture
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Stock bas
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Optimal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Archiver"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
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

      {/* CREATE / EDIT PRODUCT MODAL WITH CARRELAGE CALCULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit au Catalogue'}
                </h3>
                <p className="text-xs text-slate-500">
                  Carrelage au m² & caisses, sanitaires, robinetterie ou chauffe-eau.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Product Type selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Type de Produit</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductType('carrelage')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      productType === 'carrelage'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Carrelage (Vente m² & Cartons)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('piece')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      productType === 'piece'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sanitaire / Robinetterie (Vente par pièce)
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Désignation *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: CAR 19*57 réf 2207"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Référence / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 2207 ou MIT-301"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catégorie (Famille) *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sous-famille (Origine) *</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                  >
                    <option value="local">🇲🇦 Local (Produit marocain)</option>
                    <option value="importation">🌐 Importation (Produit étranger)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fournisseur</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SPECIAL CARRELAGE CALCULATOR FIELDS */}
              {productType === 'carrelage' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <Calculator className="w-4 h-4 text-amber-700" />
                    <span>Calculateur Dimensions & Cartons Carrelage</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Longueur (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={lengthCm}
                        onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Largeur (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={widthCm}
                        onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Carreaux / Caisse
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tilesPerBox}
                        onChange={(e) => setTilesPerBox(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Surface Math Preview Box */}
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-amber-100 text-[11px]">
                    <div>
                      <span className="text-slate-500">Surface / Carreau :</span>
                      <div className="font-bold text-slate-800 font-mono">
                        {surfacePerTile.toFixed(4)} m²
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Surface / Caisse :</span>
                      <div className="font-bold text-amber-900 font-mono">
                        {surfacePerBox.toFixed(4)} m²
                      </div>
                    </div>
                  </div>

                  {/* Pricing basis configuration */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Base de tarification saisie :
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priceBasis"
                          value="m2"
                          checked={priceBasis === 'm2'}
                          onChange={() => setPriceBasis('m2')}
                          className="text-amber-600 focus:ring-0"
                        />
                        <span>Prix par m² (DH/m²)</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="priceBasis"
                          value="caisse"
                          checked={priceBasis === 'caisse'}
                          onChange={() => setPriceBasis('caisse')}
                          className="text-amber-600 focus:ring-0"
                        />
                        <span>Prix par caisse (DH/caisse)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Stock Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Prix d'achat unitaire ({settings.currency}{productType === 'carrelage' ? (priceBasis === 'm2' ? '/m²' : '/caisse') : '/pc'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={prixAchat}
                    onChange={(e) => setPrixAchat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  {productType === 'carrelage' && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {priceBasis === 'm2'
                        ? `Soit ~ ${previewPurchasePerBox.toFixed(2)} DH / caisse`
                        : `Soit ~ ${previewPurchasePerM2.toFixed(2)} DH / m²`}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Prix de vente unitaire ({settings.currency}{productType === 'carrelage' ? (priceBasis === 'm2' ? '/m²' : '/caisse') : '/pc'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={prixVente}
                    onChange={(e) => setPrixVente(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  {productType === 'carrelage' && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {priceBasis === 'm2'
                        ? `Soit ~ ${previewSellingPerBox.toFixed(2)} DH / caisse`
                        : `Soit ~ ${previewSellingPerM2.toFixed(2)} DH / m²`}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Initial & Minimum */}
              {!editingProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {productType === 'carrelage' ? 'Stock initial (Nombre de Caisses)' : 'Stock initial (Pièces)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockInitial}
                      onChange={(e) => setStockInitial(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                    {productType === 'carrelage' && (
                      <span className="text-[10px] text-amber-800 font-semibold mt-0.5 block">
                        = {calculatedTotalTiles} carreaux ({calculatedTotalM2.toFixed(2)} m²)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Seuil Stock Minimum (Alerte)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockMin}
                      onChange={(e) => setStockMin(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Créer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
