import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  User,
  Category,
  Product,
  Supplier,
  Purchase,
  SupplierPayment,
  Client,
  Sale,
  StockMovement,
  DocumentTemplate,
  StoreSettings,
  ThemeSettings,
  SectionPermissions,
  AuditLog
} from '../types';

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  settings: StoreSettings;
  theme: ThemeSettings;
  permissions: SectionPermissions;
  documentTemplates: DocumentTemplate[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  supplierPayments: SupplierPayment[];
  clients: Client[];
  sales: Sale[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
}

// Default initial data
function getDefaultData(): DatabaseSchema {
  // Salt & Hash initial credentials
  // zitoune : 123456
  // DevAdam : Bixer15special@@@
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('123456', salt);
  const devHash = bcrypt.hashSync('Bixer15special@@@', salt);

  const defaultUsers: (User & { passwordHash: string })[] = [
    {
      id: 'usr_admin',
      username: 'zitoune',
      name: 'M. Zitoune (Gérant)',
      role: 'admin',
      passwordHash: adminHash,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr_dev',
      username: 'DevAdam',
      name: 'Adam (Développeur Principal)',
      role: 'developer',
      passwordHash: devHash,
      createdAt: '2026-01-01T08:00:00Z',
    }
  ];

  const defaultSettings: StoreSettings = {
    appName: 'Carrelage Arwa',
    businessName: 'CARRELAGE ARWA',
    logoUrl: '',
    address: 'Boulevard Ahmed Ben Hmad Dighoussi, 2 Bis Lot Ratbia Zitoune',
    phone: '0671152615',
    email: 'contact@carrelagearwa.ma',
    city: 'Meknes',
    country: 'Maroc',
    ice: '004027096000073',
    ifCode: '45892147',
    patente: '37920145',
    cnss: '7829410',
    rc: '341908 Meknes',
    currency: 'DH',
    numberFormatDecimals: 2,
    defaultLanguage: 'fr',
    receiptFooterLegalText: 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.',
    defaultPaperSize: 'A5',
    defaultTvaRate: 20,
    allowNegativeStock: false,
    carrelagePolicy: 'exact_tile',
    nextBlNumber: 1,
    nextFactureNumber: 1,
    nextPurchaseNumber: 1,
  };

  const defaultTheme: ThemeSettings = {
    primaryColor: '#b45309', // Warm Moroccan terracotta / amber 700
    secondaryColor: '#0f172a',
    accentColor: '#d97706',
    sidebarBg: '#1e293b',
    sidebarText: '#f8fafc',
    headerBg: '#ffffff',
    fontFamily: 'Plus Jakarta Sans',
    borderRadius: 'rounded-lg',
    interfaceDensity: 'comfortable',
    isDarkMode: false,
  };

  const defaultPermissions: SectionPermissions = {
    dashboard: true,
    pos: true,
    products: true,
    categories: true,
    inventory: true,
    purchases: true,
    suppliers: true,
    supplierPayments: true,
    clients: true,
    invoices: true,
    deliveryNotes: true,
    reports: true,
    printConfig: true,
    settings: true,
  };

  const defaultTemplates: DocumentTemplate[] = [
    {
      id: 'tpl_bl',
      name: 'Bon de Livraison Standard A5',
      type: 'bon_livraison',
      title: 'BON DE LIVRAISON',
      paperSize: 'A5',
      orientation: 'portrait',
      marginsMm: 8,
      showLogo: true,
      showCompanyDetails: true,
      showClientBox: true,
      showPrices: true,
      showTaxDetails: false,
      showSignatures: true,
      signatureClientLabel: 'Accusé de réception client',
      signatureVendeurLabel: 'Pour CarrelageArwa',
      showLegalNotice: true,
      legalNoticeText: 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.',
      columns: [
        { id: 'c1', key: 'designation', label: 'Désignation', visible: true, widthPercent: 44 },
        { id: 'c2', key: 'quantite', label: 'Quantité', visible: true, widthPercent: 12 },
        { id: 'c3', key: 'caisse', label: 'Caisse', visible: true, widthPercent: 11 },
        { id: 'c4', key: 'carreaux', label: 'Carreaux', visible: true, widthPercent: 11 },
        { id: 'c5', key: 'prixU', label: 'Prix U', visible: true, widthPercent: 11 },
        { id: 'c6', key: 'montant', label: 'Montant', visible: true, widthPercent: 11 },
      ],
      headerColor: '#b45309',
      tableHeaderBg: '#f1f5f9',
      fontSize: 10,
    },
    {
      id: 'tpl_facture',
      name: 'Facture Commerciale Standard A5',
      type: 'facture',
      title: 'FACTURE',
      paperSize: 'A5',
      orientation: 'portrait',
      marginsMm: 8,
      showLogo: true,
      showCompanyDetails: true,
      showClientBox: true,
      showPrices: true,
      showTaxDetails: true,
      showSignatures: true,
      signatureClientLabel: 'Visa & Bon pour accord Client',
      signatureVendeurLabel: 'La Direction',
      showLegalNotice: true,
      legalNoticeText: 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.',
      columns: [
        { id: 'c1', key: 'designation', label: 'Désignation', visible: true, widthPercent: 44 },
        { id: 'c2', key: 'quantite', label: 'Quantité', visible: true, widthPercent: 12 },
        { id: 'c3', key: 'caisse', label: 'Caisse', visible: true, widthPercent: 11 },
        { id: 'c4', key: 'carreaux', label: 'Carreaux', visible: true, widthPercent: 11 },
        { id: 'c5', key: 'prixU', label: 'Prix U (DH)', visible: true, widthPercent: 11 },
        { id: 'c6', key: 'montant', label: 'Montant (DH)', visible: true, widthPercent: 11 },
      ],
      headerColor: '#0f172a',
      tableHeaderBg: '#f1f5f9',
      fontSize: 10,
    }
  ];

  const defaultCategories: Category[] = [];

  const defaultSuppliers: Supplier[] = [];
  const defaultProducts: Product[] = [];
  const defaultClients: Client[] = [];
  const defaultStockMovements: StockMovement[] = [];
  const defaultPurchases: Purchase[] = [];
  const defaultSales: Sale[] = [];
  const defaultSupplierPayments: SupplierPayment[] = [];

  const defaultAuditLogs: AuditLog[] = [
    {
      id: 'log_001',
      userId: 'usr_dev',
      userName: 'DevAdam',
      userRole: 'developer',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'SYSTEM',
      details: 'Initialisation du système CarrelageArwa avec configuration initiale marocaine.',
      timestamp: '2026-01-01T08:00:00Z',
    }
  ];

  return {
    users: defaultUsers,
    settings: defaultSettings,
    theme: defaultTheme,
    permissions: defaultPermissions,
    documentTemplates: defaultTemplates,
    categories: defaultCategories,
    products: defaultProducts,
    suppliers: defaultSuppliers,
    purchases: defaultPurchases,
    supplierPayments: defaultSupplierPayments,
    clients: defaultClients,
    sales: defaultSales,
    stockMovements: defaultStockMovements,
    auditLogs: defaultAuditLogs,
  };
}

class Database {
  private data = getDefaultData();
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();
  public readonly ready: Promise<void>;
  private filePath = path.resolve(process.cwd(), 'data', 'database.json');

  constructor() {
    this.ready = this.init();
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private ensureInitialized() {
    // If called before ready has completed, allow access to current in-memory default data
    if (!this.initialized) {
      console.warn('[Database] Accessed before complete async init; using current in-memory data.');
    }
  }

  private async init() {
    // 1. Load local database.json if available
    try {
      const fileData = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed && typeof parsed === 'object') {
        this.data = { ...getDefaultData(), ...parsed };
      }
    } catch {
      // Keep default data if file is missing/unreadable
    }

    // 2. If Supabase is configured, try to sync
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_state')
          .select('state')
          .eq('id', 'main')
          .maybeSingle();

        if (error) {
          console.warn(`[Database] Supabase error: ${error.message}. Continuing with local data.`);
        } else if (data?.state) {
          this.data = data.state as DatabaseSchema;
        } else {
          await this.writeToSupabase(this.data).catch((err) =>
            console.warn('[Database] Initial Supabase state write failed:', err)
          );
        }
      } catch (err) {
        console.warn('[Database] Supabase not reachable. Continuing with local data:', err);
      }
    }

    this.initialized = true;
  }

  private async writeToSupabase(state: DatabaseSchema) {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase
      .from('app_state')
      .upsert({ id: 'main', state, updated_at: new Date().toISOString() });

    if (error) {
      throw new Error(`Impossible d’enregistrer dans Supabase: ${error.message}`);
    }
  }

  private async persist(state: DatabaseSchema) {
    // 1. Write to local file
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write local database.json:', err);
    }

    // 2. Write to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await this.writeToSupabase(state);
      } catch (err) {
        console.error('[Database] Supabase persist failed:', err);
      }
    }
  }

  private queuePersist() {
    const state = this.clone(this.data);
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(() => this.persist(state));
    this.writeQueue.catch((error) => console.error('Database persistence failed:', error));
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    this.ensureInitialized();
    return this.clone(this.data[key]);
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.ensureInitialized();
    this.data[key] = this.clone(value);
    this.queuePersist();
  }

  public transaction<T>(callback: (state: DatabaseSchema) => T): T {
    this.ensureInitialized();
    const snapshot = this.clone(this.data);
    try {
      const result = callback(this.data);
      this.queuePersist();
      return result;
    } catch (error) {
      // Rollback on error
      this.data = snapshot;
      throw error;
    }
  }

  public exportBackup(): string {
    this.ensureInitialized();
    return JSON.stringify(this.data, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    const parsed = JSON.parse(jsonString) as DatabaseSchema;
    if (!parsed.users || !parsed.settings || !parsed.products) {
      throw new Error('Format de sauvegarde invalide');
    }
    this.ensureInitialized();
    this.data = parsed;
    this.queuePersist();
    return true;
  }
}

export const db = new Database();
