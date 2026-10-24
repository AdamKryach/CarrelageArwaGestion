export type UserRole = 'admin' | 'developer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export type ProductType = 'carrelage' | 'piece' | 'metre' | 'lot';

export interface CarrelageDetails {
  lengthCm: number;         // e.g. 19 cm
  widthCm: number;          // e.g. 57 cm
  tilesPerBox: number;       // e.g. 10 carreaux / caisse
  surfacePerTile: number;    // (length * width) / 10000 -> m² (e.g. 0.1083 m²)
  surfacePerBox: number;     // surfacePerTile * tilesPerBox -> m² (e.g. 1.083 m²)
  boxesInStock: number;      // complete boxes
  looseTilesInStock: number; // remaining individual tiles
  totalTilesInStock: number; // total individual tiles in stock (base unit)
  totalSurfaceM2: number;    // total tiles * surfacePerTile
  priceBasis: 'm2' | 'caisse'; // configured pricing unit
  purchasePricePerM2: number;
  sellingPricePerM2: number;
  purchaseCostPerBox: number;
  sellingPricePerBox: number;
}

export interface Product {
  id: string;
  designation: string;
  reference: string;
  categoryId: string;
  productType: ProductType;
  description?: string;
  prixAchat: number;        // Purchase unit price (DH/m² for carrelage, DH/pièce for sanitaires)
  prixVente: number;        // Selling unit price (DH/m² for carrelage, DH/pièce for sanitaires)
  stockQuantity: number;    // General stock or total individual carreaux for tiles
  stockMin: number;
  supplierId?: string;
  barcode?: string;
  imageUrl?: string;
  origin?: 'local' | 'importation';
  active: boolean;
  isArchived?: boolean;
  carrelageDetails?: CarrelageDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  defaultSalesUnit: string; // 'm²', 'pièce', 'mètre', 'lot'
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  ice?: string;
  ifCode?: string;
  patente?: string;
  notes?: string;
  active: boolean;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number; // totalPurchases - totalPaid
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  designation: string;
  reference: string;
  productType: ProductType;
  quantity: number;          // total units (or tiles for carrelage)
  boxesCount?: number;       // for carrelage
  looseTilesCount?: number;  // for carrelage
  surfaceM2?: number;        // for carrelage
  unitPrice: number;         // purchase unit price
  totalPrice: number;
}

export type PaymentStatus = 'paye' | 'partiel' | 'impaye';

export interface Purchase {
  id: string;
  documentNumber: string;    // e.g. "BA-2026-001" or supplier invoice number
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalTTC: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'especes' | 'cheque' | 'virement' | 'autre';

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseId?: string;       // optionally allocated to a specific purchase
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string; // cheque #, virement #
  notes?: string;
  createdByName: string;
  createdAt: string;
}

export type ClientType = 'particulier' | 'entreprise';

export interface Client {
  id: string;
  clientType: ClientType;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ice?: string;
  ifCode?: string;
  notes?: string;
  totalSales: number;
  totalPaid: number;
  balanceDue: number;        // unpaid credit
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  designation: string;
  reference: string;
  productType: ProductType;
  dimensions?: string;
  // Carrelage specific
  requestedM2?: number;
  boxesCount?: number;
  looseTilesCount?: number;
  totalTiles?: number;
  suppliedSurfaceM2?: number;
  surfacePerBox?: number;
  // Standard piece/carrelage common
  quantity: number;          // quantity sold (m² for carrelage, pièces for sanitaires)
  unitPrice: number;         // selling price per unit
  purchaseUnitPrice: number; // recorded for margin/profitability
  discountPercent: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  bonLivraisonNumber: string; // e.g. "BL-2026-0001"
  factureNumber?: string;     // e.g. "FAC-2026-0001"
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  clientIce?: string;
  date: string;
  items: SaleItem[];
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  discountTotal: number;
  netAPayer: number;
  amountPaid: number;
  changeDue: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  isCancelled?: boolean;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdByName: string;
  createdAt: string;
}

export type StockMovementType =
  | 'initial'
  | 'achat'
  | 'vente'
  | 'retour_client'
  | 'retour_fournisseur'
  | 'correction'
  | 'casse'
  | 'perte'
  | 'annulation_vente';

export interface StockMovement {
  id: string;
  productId: string;
  productDesignation: string;
  productReference: string;
  date: string;
  quantityBefore: number;
  quantityChanged: number; // positive or negative
  quantityAfter: number;
  movementType: StockMovementType;
  referenceId?: string;    // Sale ID or Purchase ID
  userName: string;
  reason?: string;
  createdAt: string;
}

export interface DocumentColumnConfig {
  id: string;
  key: 'designation' | 'quantite' | 'caisse' | 'carreaux' | 'prixU' | 'montant';
  label: string;
  visible: boolean;
  widthPercent: number;
}

export type PaperSize = 'A4' | 'A5' | 'A6' | '80mm' | 'custom';
export type PageOrientation = 'portrait' | 'landscape';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'bon_livraison' | 'facture' | 'bon_reception' | 'bon_sortie';
  title: string;
  paperSize: PaperSize;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: PageOrientation;
  marginsMm: number;
  showLogo: boolean;
  showCompanyDetails: boolean;
  showClientBox: boolean;
  showPrices: boolean;       // whether prices & totals appear (e.g. some BLs hide prices)
  showTaxDetails: boolean;
  showSignatures: boolean;
  signatureClientLabel: string;
  signatureVendeurLabel: string;
  showLegalNotice: boolean;
  legalNoticeText: string;
  columns: DocumentColumnConfig[];
  headerColor: string;
  tableHeaderBg: string;
  fontSize: number;          // pt or px base
}

export interface StoreSettings {
  appName: string;
  businessName: string;
  logoUrl: string;
  faviconUrl?: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  ice: string;
  ifCode: string;
  patente: string;
  cnss: string;
  rc: string;
  currency: string;          // "DH" or "MAD"
  numberFormatDecimals: number;
  defaultLanguage: string;
  receiptFooterLegalText: string;
  defaultPaperSize: PaperSize;
  defaultTvaRate: number;    // e.g. 20 (%) or 0
  allowNegativeStock: boolean;
  carrelagePolicy: 'exact_tile' | 'complete_box_only';
  nextBlNumber: number;
  nextFactureNumber: number;
  nextPurchaseNumber: number;
}

export interface ThemeSettings {
  primaryColor: string;      // Hex
  secondaryColor: string;
  accentColor: string;
  sidebarBg: string;
  sidebarText: string;
  headerBg: string;
  fontFamily: string;
  borderRadius: string;      // 'rounded-none' | 'rounded-md' | 'rounded-lg' | 'rounded-xl'
  interfaceDensity: 'compact' | 'comfortable' | 'spacious';
  isDarkMode: boolean;
}

export interface SectionPermissions {
  dashboard: boolean;
  pos: boolean;
  products: boolean;
  categories: boolean;
  inventory: boolean;
  purchases: boolean;
  suppliers: boolean;
  supplierPayments: boolean;
  clients: boolean;
  invoices: boolean;
  deliveryNotes: boolean;
  reports: boolean;
  printConfig: boolean;
  settings: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalActiveProducts: number;
  productsLowStock: number;
  productsOutOfStock: number;
  totalStockQuantity: number;
  totalStockSurfaceM2: number;
  stockPurchaseValuation: number;
  stockSellingValuation: number;
  salesToday: number;
  salesCurrentMonth: number;
  purchasesCurrentMonth: number;
  totalSupplierDebt: number;
  totalClientCredit: number;
  paymentsMadeToSuppliers: number;
  recentSales: Sale[];
  recentPurchases: Purchase[];
  salesByDay: { date: string; amount: number; count: number }[];
  salesByCategory: { category: string; amount: number; count: number }[];
  topSellingProducts: { designation: string; reference: string; quantity: number; revenue: number }[];
}
