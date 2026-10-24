import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product, Client, Category, Sale, DocumentTemplate, StoreSettings } from '../../types';
import { DocumentRenderer } from '../documents/DocumentRenderer';
import {
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  Calculator,
  Layers,
  User,
  CreditCard,
  Printer,
  FileCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface PosViewProps {
  settings: StoreSettings;
  templates: DocumentTemplate[];
  onSaleCompleted?: () => void;
}

interface CartItem {
  product: Product;
  requestedM2: number;          // for carrelage
  boxesCount: number;           // calculated or user set
  looseTilesCount: number;      // calculated or user set
  totalTiles: number;           // total individual tiles
  suppliedSurfaceM2: number;    // actual physical surface supplied
  surplusM2: number;            // supplied - requested
  sellByBoxOnly: boolean;       // whether store opens boxes or sells full boxes only
  chargeSuppliedSurface: boolean; // whether to bill supplied or requested
  quantity: number;             // final billed quantity (m² or pieces)
  unitPrice: number;            // selling unit price (DH/m² or DH/pc)
  discountPercent: number;
  lineTotal: number;
}

export const PosView: React.FC<PosViewProps> = ({ settings, templates, onSaleCompleted }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | 'local' | 'importation'>('all');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Client & Checkout details
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('Client de passage');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIce, setClientIce] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cheque' | 'virement' | 'autre'>('especes');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [applyTva, setApplyTva] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [generateFacture, setGenerateFacture] = useState(false);

  // Completed sale modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [activeDocType, setActiveDocType] = useState<'bon_livraison' | 'facture'>('bon_livraison');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'catalog' | 'cart'>('catalog');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, clis, cats] = await Promise.all([
        api.getProducts(),
        api.getClients(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setClients(clis);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('Client de passage');
      setClientPhone('');
      setClientAddress('');
      setClientIce('');
      return;
    }
    const c = clients.find((x) => x.id === clientId);
    if (c) {
      setClientName(c.name);
      setClientPhone(c.phone || '');
      setClientAddress(c.address || '');
      setClientIce(c.ice || '');
      if (c.clientType === 'entreprise') {
        setGenerateFacture(true);
      }
    }
  };

  // Add product to cart with initial calculations
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (product.productType === 'carrelage' && product.carrelageDetails) {
      const details = product.carrelageDetails;
      // Default initial quantity: 1 box surface or 1.0 m²
      const initialM2 = details.surfacePerBox > 0 ? details.surfacePerBox : 1.0;
      const spt = details.surfacePerTile;
      const tpb = details.tilesPerBox;

      const totalTiles = Math.max(1, Math.ceil(initialM2 / spt));
      const boxesCount = Math.floor(totalTiles / tpb);
      const looseTilesCount = totalTiles % tpb;
      const suppliedSurface = Number((totalTiles * spt).toFixed(3));
      const surplus = Number((suppliedSurface - initialM2).toFixed(3));

      const price = details.sellingPricePerM2;
      const lineTotal = Number((initialM2 * price).toFixed(2));

      if (existingIndex !== -1) {
        // Increase requested m² by 1 box
        updateCartItemM2(existingIndex, cart[existingIndex].requestedM2 + details.surfacePerBox);
      } else {
        const newItem: CartItem = {
          product,
          requestedM2: initialM2,
          boxesCount,
          looseTilesCount,
          totalTiles,
          suppliedSurfaceM2: suppliedSurface,
          surplusM2: surplus,
          sellByBoxOnly: false,
          chargeSuppliedSurface: false,
          quantity: initialM2,
          unitPrice: price,
          discountPercent: 0,
          lineTotal,
        };
        setCart([...cart, newItem]);
      }
    } else {
      // Piece product (Sanitaire, Robinetterie, Chauffe-eau)
      if (existingIndex !== -1) {
        updateCartItemQty(existingIndex, cart[existingIndex].quantity + 1);
      } else {
        const newItem: CartItem = {
          product,
          requestedM2: 0,
          boxesCount: 0,
          looseTilesCount: 0,
          totalTiles: 1,
          suppliedSurfaceM2: 0,
          surplusM2: 0,
          sellByBoxOnly: false,
          chargeSuppliedSurface: false,
          quantity: 1,
          unitPrice: product.prixVente,
          discountPercent: 0,
          lineTotal: product.prixVente,
        };
        setCart([...cart, newItem]);
      }
    }
  };

  // Update carrelage requested surface m² with live re-calculation
  const updateCartItemM2 = (index: number, requestedM2: number) => {
    const updated = [...cart];
    const item = updated[index];
    const details = item.product.carrelageDetails!;
    const spt = details.surfacePerTile;
    const spb = details.surfacePerBox;
    const tpb = details.tilesPerBox;

    const req = Math.max(0.1, requestedM2);

    let totalTiles = 0;
    let boxes = 0;
    let loose = 0;
    let supplied = 0;

    if (item.sellByBoxOnly) {
      boxes = Math.max(1, Math.ceil(req / spb));
      loose = 0;
      totalTiles = boxes * tpb;
      supplied = Number((boxes * spb).toFixed(3));
    } else {
      totalTiles = Math.max(1, Math.ceil(req / spt));
      boxes = Math.floor(totalTiles / tpb);
      loose = totalTiles % tpb;
      supplied = Number((totalTiles * spt).toFixed(3));
    }

    const surplus = Number((supplied - req).toFixed(3));
    const billedQty = item.chargeSuppliedSurface ? supplied : req;
    const baseTotal = billedQty * item.unitPrice;
    const lineTotal = baseTotal * (1 - item.discountPercent / 100);

    item.requestedM2 = Number(req.toFixed(2));
    item.boxesCount = boxes;
    item.looseTilesCount = loose;
    item.totalTiles = totalTiles;
    item.suppliedSurfaceM2 = supplied;
    item.surplusM2 = surplus;
    item.quantity = Number(billedQty.toFixed(2));
    item.lineTotal = Number(lineTotal.toFixed(2));

    setCart(updated);
  };

  // Toggle sale policy between exact m² with open boxes vs complete boxes only
  const toggleCartItemBoxOnly = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    item.sellByBoxOnly = !item.sellByBoxOnly;
    setCart(updated);
    updateCartItemM2(index, item.requestedM2);
  };

  // Toggle charge surface between requested and actual supplied
  const toggleChargeSupplied = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    item.chargeSuppliedSurface = !item.chargeSuppliedSurface;
    setCart(updated);
    updateCartItemM2(index, item.requestedM2);
  };

  // Update piece quantity
  const updateCartItemQty = (index: number, quantity: number) => {
    const updated = [...cart];
    const item = updated[index];
    const q = Math.max(1, quantity);
    const base = q * item.unitPrice;
    item.quantity = q;
    item.lineTotal = Number((base * (1 - item.discountPercent / 100)).toFixed(2));
    setCart(updated);
  };

  // Update unit price or discount
  const updateCartItemPrice = (index: number, unitPrice: number) => {
    const updated = [...cart];
    const item = updated[index];
    item.unitPrice = Number(unitPrice);
    const base = item.quantity * item.unitPrice;
    item.lineTotal = Number((base * (1 - item.discountPercent / 100)).toFixed(2));
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  // Financial calculations
  const rawTotalHT = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalHT = Math.max(0, rawTotalHT - globalDiscount);
  const tvaAmount = applyTva ? (totalHT * settings.defaultTvaRate) / 100 : 0;
  const netAPayer = totalHT + tvaAmount;
  const totalTTC = netAPayer;

  // Auto-fill amount paid
  useEffect(() => {
    setAmountPaid(Number(netAPayer.toFixed(2)));
  }, [netAPayer]);

  const changeDue = Math.max(0, amountPaid - netAPayer);
  const balanceDue = Math.max(0, netAPayer - amountPaid);

  // Filter products for quick search & dropdown filters
  const filteredProducts = products.filter((p) => {
    if (p.isArchived) return false;

    // 1. Stock Status filter: positif (> 0) ou négatif / rupture (<= 0)
    if (stockStatusFilter === 'positive' && p.stockQuantity <= 0) return false;
    if (stockStatusFilter === 'negative' && p.stockQuantity > 0) return false;

    // 2. Famille (Catégories)
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

    // 3. Sous-famille (Origine : Local marocain ou Importation étranger)
    const origin = p.origin || 'local';
    if (selectedOrigin !== 'all' && origin !== selectedOrigin) return false;

    if (!searchQuery.trim()) return true;

    const tokens = searchQuery.toLowerCase().split(/\s+/);
    const cat = categories.find((c) => c.id === p.categoryId);
    const text = `${p.designation} ${p.reference} ${p.barcode || ''} ${origin} ${cat?.name || ''} ${
      p.carrelageDetails ? `${p.carrelageDetails.lengthCm}*${p.carrelageDetails.widthCm}` : ''
    }`.toLowerCase();

    return tokens.every((t) => text.includes(t));
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        clientId: selectedClientId || undefined,
        clientName,
        clientPhone: clientPhone || undefined,
        clientAddress: clientAddress || undefined,
        clientIce: clientIce || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          productType: item.product.productType,
          requestedM2: item.requestedM2,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          sellByBoxOnly: item.sellByBoxOnly,
          chargeSuppliedSurface: item.chargeSuppliedSurface,
        })),
        discountTotal: globalDiscount,
        applyTva,
        paymentMethod,
        amountPaid,
        notes,
        generateFacture,
      };

      const sale = await api.createSale(payload);
      setCompletedSale(sale);
      setActiveDocType(generateFacture ? 'facture' : 'bon_livraison');

      // Clear cart
      setCart([]);
      setGlobalDiscount(0);
      setNotes('');
      // Reload products to reflect stock decrement
      loadData();
      if (onSaleCompleted) onSaleCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la vente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const blTemplate = templates.find((t) => t.type === 'bon_livraison');
  const facTemplate = templates.find((t) => t.type === 'facture');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* SUCCESS MODAL / PRINT PREVIEW */}
      {completedSale && (
        <DocumentRenderer
          sale={completedSale}
          type={activeDocType}
          template={activeDocType === 'facture' ? facTemplate : blTemplate}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible on Phones & Tablets < lg) */}
      <div className="lg:hidden flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold gap-1">
        <button
          onClick={() => setMobileActiveView('catalog')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'catalog'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Articles ({filteredProducts.length})</span>
        </button>
        <button
          onClick={() => setMobileActiveView('cart')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'cart'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Panier ({cart.length}) {cart.length > 0 && `· ${totalTTC.toFixed(0)} ${settings.currency}`}</span>
        </button>
      </div>

      {/* POS SPLIT SCREEN: LEFT SEARCH & CATALOG / RIGHT CART & TOTALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: PRODUCT SEARCH & INSTANT SELECTION (7 COLS) */}
        <div className={`lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 ${
          mobileActiveView === 'catalog' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Catalogue & Calculateur Vente</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {filteredProducts.length} articles disponibles
            </span>
          </div>

          {/* Search Bar & 3 Dropdown Filters: État du Stock, Famille, Sous-famille */}
          <div className="space-y-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher désignation, réf (ex: 2207), dimension (19*57), code-barres..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>

            {/* 3 Dropdown Filters in Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-xs">
              {/* Dropdown 1: État du stock */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-600" />
                  <span>État du Stock</span>
                </label>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Tous les états de stock</option>
                  <option value="positive">✓ Stock positif (En stock)</option>
                  <option value="negative">⚠ Stock négatif (Rupture)</option>
                </select>
              </div>

              {/* Dropdown 2: Famille (Toutes les catégories) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-600" />
                  <span>Famille</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Toutes les familles ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 3: Sous-famille (Importation / Local) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>🌐</span>
                  <span>Sous-famille (Origine)</span>
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Toutes les sous-familles</option>
                  <option value="local">🇲🇦 Local (Maroc)</option>
                  <option value="importation">🌐 Importation (Étranger)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Produit & Réf</th>
                  <th className="py-2.5 px-2 text-center">Famille</th>
                  <th className="py-2.5 px-2 text-center">Stock Dispo</th>
                  <th className="py-2.5 px-2 text-right">Prix Vente</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Aucun article ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isCarrelage = p.productType === 'carrelage' && p.carrelageDetails;
                    const isOutOfStock = p.stockQuantity <= 0;
                    const origin = p.origin || 'local';
                    const cat = categories.find((c) => c.id === p.categoryId);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-amber-50/40 transition-colors ${
                          isOutOfStock ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{p.designation}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-amber-800 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              Réf: {p.reference}
                            </span>
                            {origin === 'importation' ? (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-0.5">
                                <span>🌐</span> Importation
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                <span>🇲🇦</span> Local
                              </span>
                            )}
                            {isCarrelage && (
                              <span className="text-slate-500">
                                · {p.carrelageDetails?.lengthCm}x{p.carrelageDetails?.widthCm} cm ({p.carrelageDetails?.surfacePerBox} m²/caisse)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                            {cat?.name || p.productType}
                          </span>
                        </td>

                        <td className="py-2 px-2 text-center font-mono">
                          {isCarrelage ? (
                            <div className="text-[11px] leading-tight">
                              <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-slate-800'}`}>
                                {p.carrelageDetails?.boxesInStock} caisses
                              </span>
                              {p.carrelageDetails && p.carrelageDetails.looseTilesInStock > 0 && (
                                <span className="text-[10px] text-slate-500"> +{p.carrelageDetails.looseTilesInStock} car.</span>
                              )}
                              <div className={`text-[9.5px] font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-amber-700'}`}>
                                {isOutOfStock ? '⚠ Rupture' : `(${p.carrelageDetails?.totalSurfaceM2} m²)`}
                              </div>
                            </div>
                          ) : (
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              isOutOfStock ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-slate-800'
                            }`}>
                              {isOutOfStock ? `Rupture (${p.stockQuantity})` : `${p.stockQuantity} pcs`}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                          {p.prixVente.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">{settings.currency}{isCarrelage ? '/m²' : ''}</span>
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={isOutOfStock && !settings.allowNegativeStock}
                            className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Ajouter au panier"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: CART, CARRELAGE CALCULATOR & ORDER SUMMARY (5 COLS) */}
        <div className={`lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 ${
          mobileActiveView === 'cart' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Mobile Back Button */}
          <div className="lg:hidden pb-1">
            <button
              onClick={() => setMobileActiveView('catalog')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center space-x-1"
            >
              <span>&larr;</span>
              <span>Continuer à ajouter des articles</span>
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-slate-900">Panier de Vente</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {cart.length} ligne(s)
            </span>
          </div>

          {/* Client Selection */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Client</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleSelectClient(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Client de passage (Comptoir)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.clientType === 'entreprise' ? '(Entreprise)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                placeholder="Nom du client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Tél (ex: 0661...)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
              />
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Votre panier est vide. Cliquez sur un produit à gauche pour l'ajouter à la vente.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const isCarrelage = item.product.productType === 'carrelage' && item.product.carrelageDetails;

                return (
                  <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-2 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{item.product.designation}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Réf: {item.product.reference}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Specialized Carrelage Interactive Calculations */}
                    {isCarrelage ? (
                      <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700">Surface demandée (m²) :</label>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={item.requestedM2}
                              onChange={(e) => updateCartItemM2(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-0.5 border border-slate-300 rounded bg-white text-right font-mono font-bold text-xs"
                            />
                            <span className="font-semibold text-slate-500">m²</span>
                          </div>
                        </div>

                        {/* Calculated Boxes & Loose Tiles details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded border border-amber-100">
                          <div>
                            <span className="text-slate-500">Cartons complets :</span>
                            <div className="font-bold text-slate-800">{item.boxesCount} caisses</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Carreaux au détail :</span>
                            <div className="font-bold text-slate-800">{item.looseTilesCount} carreaux</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Surface fournie :</span>
                            <div className="font-bold text-amber-800">{item.suppliedSurfaceM2} m²</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Surplus :</span>
                            <div className="font-bold text-slate-700">+{item.surplusM2} m²</div>
                          </div>
                        </div>

                        {/* Selling mode toggles */}
                        <div className="flex items-center justify-between text-[10px] text-slate-600 pt-0.5">
                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.sellByBoxOnly}
                              onChange={() => toggleCartItemBoxOnly(idx)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-0"
                            />
                            <span>Cartons complets uniquement</span>
                          </label>

                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.chargeSuppliedSurface}
                              onChange={() => toggleChargeSupplied(idx)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-0"
                            />
                            <span>Facturer surface fournie ({item.suppliedSurfaceM2} m²)</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      // Standard Piece Product input
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700">Quantité (pièces) :</label>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-0.5 border border-slate-300 rounded bg-white text-right font-mono font-bold text-xs"
                          />
                          <span className="font-semibold text-slate-500">pcs</span>
                        </div>
                      </div>
                    )}

                    {/* Unit Price & Line Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-500">Prix U:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={item.unitPrice}
                          onChange={(e) => updateCartItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono text-xs"
                        />
                        <span className="text-[10px] text-slate-500">{settings.currency}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {item.lineTotal.toFixed(2)} {settings.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CHECKOUT TOTALS & OPTIONS */}
          {cart.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total HT :</span>
                <span className="font-mono font-bold">{rawTotalHT.toFixed(2)} {settings.currency}</span>
              </div>

              {/* Discount Input */}
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Remise globale :</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 border border-slate-300 rounded text-right font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500">{settings.currency}</span>
                </div>
              </div>

              {/* TVA Toggle */}
              <div className="flex justify-between items-center text-slate-600">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTva}
                    onChange={(e) => setApplyTva(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span>Appliquer TVA ({settings.defaultTvaRate}%)</span>
                </label>
                {applyTva && <span className="font-mono">{tvaAmount.toFixed(2)} {settings.currency}</span>}
              </div>

              {/* Net à payer */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Net à Payer</div>
                  <div className="text-xl font-black font-mono">{netAPayer.toFixed(2)} {settings.currency}</div>
                </div>

                <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateFacture}
                    onChange={(e) => setGenerateFacture(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Émettre Facture</span>
                </label>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Mode de Règlement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Montant Perçu
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-right"
                  />
                </div>
              </div>

              {/* Change due or balance due */}
              {changeDue > 0 && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between text-emerald-800 font-semibold text-xs">
                  <span>Monnaie à rendre :</span>
                  <span className="font-mono font-bold">{changeDue.toFixed(2)} {settings.currency}</span>
                </div>
              )}

              {balanceDue > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex justify-between text-amber-900 font-semibold text-xs">
                  <span>Reste à payer (Vente à crédit) :</span>
                  <span className="font-mono font-bold">{balanceDue.toFixed(2)} {settings.currency}</span>
                </div>
              )}

              {/* Confirm Sale Button */}
              <button
                onClick={handleCheckout}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Validation...' : 'Valider la Vente & Imprimer BL/Facture'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Cart Summary Button when browsing catalog */}
      {cart.length > 0 && mobileActiveView === 'catalog' && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
          <button
            onClick={() => setMobileActiveView('cart')}
            className="w-full bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-amber-500/50 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                {cart.length}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Voir le Panier de Vente</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  Total : {totalTTC.toFixed(2)} {settings.currency}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
              <span>Commander</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
