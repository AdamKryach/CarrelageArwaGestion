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
  StoreSettings,
  ThemeSettings,
  SectionPermissions,
  DocumentTemplate,
  AuditLog,
  DashboardStats
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('arwa_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User; permissions: SectionPermissions; appName: string; businessName: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    request<{ user: User; permissions: SectionPermissions; settings: StoreSettings; theme: ThemeSettings }>('/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Settings & Theme
  getSettings: () => request<StoreSettings>('/settings'),
  updateSettings: (settings: Partial<StoreSettings>) =>
    request<StoreSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getTheme: () => request<ThemeSettings>('/theme'),
  updateTheme: (theme: Partial<ThemeSettings>) =>
    request<ThemeSettings>('/theme', {
      method: 'PUT',
      body: JSON.stringify(theme),
    }),

  getPermissions: () => request<SectionPermissions>('/permissions'),
  updatePermissions: (permissions: Partial<SectionPermissions>) =>
    request<SectionPermissions>('/permissions', {
      method: 'PUT',
      body: JSON.stringify(permissions),
    }),

  // Document Templates
  getDocumentTemplates: () => request<DocumentTemplate[]>('/document-templates'),
  createDocumentTemplate: (template: Partial<DocumentTemplate>) =>
    request<DocumentTemplate>('/document-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),
  updateDocumentTemplate: (id: string, template: Partial<DocumentTemplate>) =>
    request<{ success: boolean }>('/document-templates/' + id, {
      method: 'PUT',
      body: JSON.stringify(template),
    }),
  deleteDocumentTemplate: (id: string) =>
    request<{ success: boolean }>('/document-templates/' + id, { method: 'DELETE' }),

  // Developer operations
  updateCredentials: (data: { targetRole: 'admin' | 'developer'; newUsername?: string; newPassword?: string; newName?: string }) =>
    request<{ success: boolean; message: string }>('/developer/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  restoreBackup: (backupData: any) =>
    request<{ success: boolean; message: string }>('/developer/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData }),
    }),

  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: Partial<Category>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<{ success: boolean }>('/categories/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>('/categories/' + id, { method: 'DELETE' }),

  // Products
  getProducts: (params?: { search?: string; category?: string; stockFilter?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.stockFilter) q.append('stockFilter', params.stockFilter);
    return request<Product[]>('/products?' + q.toString());
  },
  createProduct: (data: any) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request<{ success: boolean }>('/products/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>('/products/' + id, { method: 'DELETE' }),

  // Inventory
  getStockMovements: (params?: { productId?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.productId) q.append('productId', params.productId);
    if (params?.type) q.append('type', params.type);
    return request<StockMovement[]>('/inventory/movements?' + q.toString());
  },
  adjustStock: (data: { productId: string; newQuantity: number; reason: string; movementType?: string }) =>
    request<{ success: boolean; message: string }>('/inventory/adjustment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    request<{ success: boolean }>('/suppliers/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) =>
    request<{ success: boolean }>('/suppliers/' + id, { method: 'DELETE' }),
  getSupplierDetails: (id: string) =>
    request<{ supplier: Supplier; purchases: Purchase[]; payments: SupplierPayment[] }>('/suppliers/' + id + '/details'),

  // Purchases
  getPurchases: () => request<Purchase[]>('/purchases'),
  createPurchase: (data: any) =>
    request<Purchase>('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Supplier Payments
  getSupplierPayments: () => request<SupplierPayment[]>('/supplier-payments'),
  createSupplierPayment: (data: any) =>
    request<SupplierPayment>('/supplier-payments', { method: 'POST', body: JSON.stringify(data) }),

  // Clients
  getClients: () => request<Client[]>('/clients'),
  createClient: (data: Partial<Client>) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<{ success: boolean }>('/clients/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) =>
    request<{ success: boolean }>('/clients/' + id, { method: 'DELETE' }),

  // Sales
  getSales: () => request<Sale[]>('/sales'),
  createSale: (data: any) =>
    request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  cancelSale: (id: string, reason: string) =>
    request<{ success: boolean; message: string }>('/sales/' + id + '/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Dashboard & Reports
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
  getReports: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    return request<any>('/reports?' + q.toString());
  },
};
