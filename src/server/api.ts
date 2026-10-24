import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import {
  requireAuth,
  requireDeveloper,
  checkSectionPermission,
  createSession,
  destroySession,
  AuthRequest
} from './auth';
import {
  Product,
  CarrelageDetails,
  Category,
  Supplier,
  Purchase,
  SupplierPayment,
  Client,
  Sale,
  StockMovement,
  AuditLog,
  DocumentTemplate
} from '../types';

export const apiRouter = Router();

// Helper to log audit events
function recordAudit(req: AuthRequest, action: string, entity: string, entityId: string | undefined, details: string) {
  try {
    const user = req.user;
    const log: AuditLog = {
      id: 'log_' + crypto.randomUUID().slice(0, 8),
      userId: user?.id || 'system',
      userName: user?.name || user?.username || 'Anonyme',
      userRole: user?.role || 'admin',
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    db.transaction((state) => {
      state.auditLogs.unshift(log);
      if (state.auditLogs.length > 500) {
        state.auditLogs = state.auditLogs.slice(0, 500);
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }

  const validPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  db.transaction((state) => {
    const u = state.users.find((x) => x.id === user.id);
    if (u) u.lastLoginAt = user.lastLoginAt;
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  const token = createSession(userWithoutPassword);

  const permissions = db.get('permissions');
  const settings = db.get('settings');

  recordAudit({ user: userWithoutPassword } as AuthRequest, 'LOGIN', 'USER', user.id, `Connexion réussie de ${user.name} (${user.role})`);

  return res.json({
    token,
    user: userWithoutPassword,
    permissions,
    appName: settings.appName,
    businessName: settings.businessName,
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const permissions = db.get('permissions');
  const settings = db.get('settings');
  const theme = db.get('theme');

  return res.json({
    user: req.user,
    permissions,
    settings,
    theme,
  });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    destroySession(token);
  }
  return res.json({ success: true, message: 'Déconnexion effectuée.' });
});

apiRouter.post('/auth/change-password', requireAuth, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 5 caractères.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé.' });
  }

  // If not developer changing someone else's password, verify current password
  if (currentPassword) {
    const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);

  db.transaction((state) => {
    const u = state.users.find((x) => x.id === user.id);
    if (u) {
      u.passwordHash = newHash;
    }
  });

  recordAudit(req, 'CHANGE_PASSWORD', 'USER', user.id, `Changement de mot de passe pour ${user.name}`);
  return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
});

// -------------------------------------------------------------
// SETTINGS & DEVELOPER PANEL
// -------------------------------------------------------------

apiRouter.get('/settings', (req, res) => {
  const settings = db.get('settings');
  return res.json(settings);
});

apiRouter.put('/settings', requireDeveloper, (req: AuthRequest, res: Response) => {
  const updated = req.body;
  db.transaction((state) => {
    state.settings = { ...state.settings, ...updated };
  });
  recordAudit(req, 'UPDATE_SETTINGS', 'SETTINGS', undefined, 'Mise à jour des paramètres d’entreprise');
  return res.json(db.get('settings'));
});

apiRouter.get('/theme', (req, res) => {
  return res.json(db.get('theme'));
});

apiRouter.put('/theme', requireDeveloper, (req: AuthRequest, res: Response) => {
  const updated = req.body;
  db.transaction((state) => {
    state.theme = { ...state.theme, ...updated };
  });
  recordAudit(req, 'UPDATE_THEME', 'THEME', undefined, 'Personnalisation des couleurs et du thème');
  return res.json(db.get('theme'));
});

apiRouter.get('/permissions', requireAuth, (req, res) => {
  return res.json(db.get('permissions'));
});

apiRouter.put('/permissions', requireDeveloper, (req: AuthRequest, res: Response) => {
  const updated = req.body;
  db.transaction((state) => {
    state.permissions = { ...state.permissions, ...updated };
  });
  recordAudit(req, 'UPDATE_PERMISSIONS', 'PERMISSIONS', undefined, 'Modification des permissions d’accès Admin');
  return res.json(db.get('permissions'));
});

// Document templates (Designer)
apiRouter.get('/document-templates', requireAuth, (req, res) => {
  return res.json(db.get('documentTemplates'));
});

apiRouter.post('/document-templates', requireDeveloper, (req: AuthRequest, res: Response) => {
  const newTemplate: DocumentTemplate = {
    ...req.body,
    id: 'tpl_' + crypto.randomUUID().slice(0, 8),
  };

  db.transaction((state) => {
    state.documentTemplates.push(newTemplate);
  });
  recordAudit(req, 'CREATE_TEMPLATE', 'TEMPLATE', newTemplate.id, `Création du modèle d’impression ${newTemplate.name}`);
  return res.json(newTemplate);
});

apiRouter.put('/document-templates/:id', requireDeveloper, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = req.body;

  db.transaction((state) => {
    const idx = state.documentTemplates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      state.documentTemplates[idx] = { ...state.documentTemplates[idx], ...updated };
    }
  });

  recordAudit(req, 'UPDATE_TEMPLATE', 'TEMPLATE', id, `Modification du modèle d’impression ${updated.name || id}`);
  return res.json({ success: true, message: 'Modèle mis à jour avec succès.' });
});

apiRouter.delete('/document-templates/:id', requireDeveloper, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.transaction((state) => {
    state.documentTemplates = state.documentTemplates.filter((t) => t.id !== id);
  });
  recordAudit(req, 'DELETE_TEMPLATE', 'TEMPLATE', id, `Suppression du modèle d’impression ${id}`);
  return res.json({ success: true });
});

// Developer account management (Dev can change username or password of accounts)
apiRouter.post('/developer/credentials', requireDeveloper, (req: AuthRequest, res: Response) => {
  const { targetRole, newUsername, newPassword, newName } = req.body;

  if (!targetRole || (!newUsername && !newPassword && !newName)) {
    return res.status(400).json({ error: 'Paramètres manquants.' });
  }

  db.transaction((state) => {
    const target = state.users.find((u) => u.role === targetRole);
    if (!target) {
      throw new Error(`Compte avec rôle ${targetRole} non trouvé.`);
    }

    if (newUsername && newUsername.trim()) {
      // Check duplicate
      const exists = state.users.find((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase() && u.id !== target.id);
      if (exists) {
        throw new Error('Cet identifiant est déjà utilisé.');
      }
      target.username = newUsername.trim();
    }

    if (newName && newName.trim()) {
      target.name = newName.trim();
    }

    if (newPassword && newPassword.length >= 5) {
      const salt = bcrypt.genSaltSync(10);
      target.passwordHash = bcrypt.hashSync(newPassword, salt);
    }
  });

  recordAudit(req, 'UPDATE_CREDENTIALS', 'USER', targetRole, `Mise à jour des identifiants du rôle ${targetRole}`);
  return res.json({ success: true, message: `Identifiants ${targetRole} mis à jour avec succès.` });
});

// Developer Backup & Restore
apiRouter.get('/developer/backup', requireDeveloper, (req: AuthRequest, res: Response) => {
  const jsonBackup = db.exportBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=CarrelageArwa_backup_${new Date().toISOString().split('T')[0]}.json`);
  return res.send(jsonBackup);
});

apiRouter.post('/developer/restore', requireDeveloper, (req: AuthRequest, res: Response) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: 'Données de sauvegarde absentes.' });
    }

    const payload = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);
    db.importBackup(payload);

    recordAudit(req, 'RESTORE_BACKUP', 'SYSTEM', undefined, 'Restauration complète de la base de données');
    return res.json({ success: true, message: 'Base de données restaurée avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur lors de la restauration.' });
  }
});

apiRouter.get('/audit-logs', requireDeveloper, (req: AuthRequest, res: Response) => {
  const logs = db.get('auditLogs');
  return res.json(logs);
});

// -------------------------------------------------------------
// CATEGORIES (CRUD)
// -------------------------------------------------------------

apiRouter.get('/categories', checkSectionPermission('categories'), (req, res) => {
  return res.json(db.get('categories'));
});

apiRouter.post('/categories', checkSectionPermission('categories'), (req: AuthRequest, res: Response) => {
  const { name, description, icon, defaultSalesUnit } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
  }

  const category: Category = {
    id: 'cat_' + crypto.randomUUID().slice(0, 8),
    name: name.trim(),
    description: description?.trim() || '',
    icon: icon || 'Layers',
    defaultSalesUnit: defaultSalesUnit || 'pièce',
    active: true,
  };

  db.transaction((state) => {
    state.categories.push(category);
  });

  recordAudit(req, 'CREATE_CATEGORY', 'CATEGORY', category.id, `Création de la catégorie ${category.name}`);
  return res.json(category);
});

apiRouter.put('/categories/:id', checkSectionPermission('categories'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, icon, defaultSalesUnit, active } = req.body;

  db.transaction((state) => {
    const cat = state.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Catégorie introuvable.');
    if (name) cat.name = name.trim();
    if (description !== undefined) cat.description = description.trim();
    if (icon) cat.icon = icon;
    if (defaultSalesUnit) cat.defaultSalesUnit = defaultSalesUnit;
    if (active !== undefined) cat.active = !!active;
  });

  recordAudit(req, 'UPDATE_CATEGORY', 'CATEGORY', id, `Modification de la catégorie ${name || id}`);
  return res.json({ success: true });
});

apiRouter.delete('/categories/:id', checkSectionPermission('categories'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if products exist in category
  const products = db.get('products');
  const count = products.filter((p) => p.categoryId === id && !p.isArchived).length;
  if (count > 0) {
    return res.status(400).json({ error: `Impossible de supprimer : ${count} produit(s) sont liés à cette catégorie.` });
  }

  db.transaction((state) => {
    state.categories = state.categories.filter((c) => c.id !== id);
  });

  recordAudit(req, 'DELETE_CATEGORY', 'CATEGORY', id, `Suppression de la catégorie ${id}`);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// PRODUCTS & SPECIAL CARRELAGE MANAGEMENT (CRUD)
// -------------------------------------------------------------

apiRouter.get('/products', checkSectionPermission('products'), (req, res) => {
  const { search, category, stockFilter, origin, includeArchived } = req.query;
  let products = db.get('products');

  if (!includeArchived || includeArchived === 'false') {
    products = products.filter((p) => !p.isArchived);
  }

  if (category && category !== 'all') {
    products = products.filter((p) => p.categoryId === category);
  }

  if (origin && origin !== 'all') {
    products = products.filter((p) => (p.origin || 'local') === origin);
  }

  if (stockFilter === 'low') {
    products = products.filter((p) => p.stockQuantity <= p.stockMin && p.stockQuantity > 0);
  } else if (stockFilter === 'out' || stockFilter === 'negative') {
    products = products.filter((p) => p.stockQuantity <= 0);
  } else if (stockFilter === 'positive') {
    products = products.filter((p) => p.stockQuantity > 0);
  }

  if (search && typeof search === 'string') {
    const tokens = search.toLowerCase().trim().split(/\s+/);
    products = products.filter((p) => {
      const fullText = `${p.designation} ${p.reference} ${p.barcode || ''} ${p.origin || ''} ${p.carrelageDetails ? `${p.carrelageDetails.lengthCm}*${p.carrelageDetails.widthCm} ${p.carrelageDetails.surfacePerBox}` : ''}`.toLowerCase();
      return tokens.every((token) => fullText.includes(token));
    });
  }

  return res.json(products);
});

apiRouter.post('/products', checkSectionPermission('products'), (req: AuthRequest, res: Response) => {
  const {
    designation,
    reference,
    categoryId,
    productType,
    origin, // 'local' | 'importation'
    description,
    prixAchat,
    prixVente,
    stockInitial, // initial boxes or pieces
    stockMin,
    supplierId,
    barcode,
    imageUrl,
    // Carrelage specific inputs
    lengthCm,
    widthCm,
    tilesPerBox,
    priceBasis, // 'm2' or 'caisse'
  } = req.body;

  if (!designation || !reference || !categoryId || !productType) {
    return res.status(400).json({ error: 'La désignation, référence, catégorie et type sont obligatoires.' });
  }

  // Prevent duplicate reference
  const products = db.get('products');
  const existing = products.find((p) => p.reference.toLowerCase() === reference.trim().toLowerCase() && !p.isArchived);
  if (existing) {
    return res.status(400).json({ error: `La référence "${reference}" existe déjà pour le produit "${existing.designation}".` });
  }

  let computedCarrelageDetails: CarrelageDetails | undefined = undefined;
  let finalStockQuantity = Number(stockInitial) || 0;

  if (productType === 'carrelage') {
    const l = Number(lengthCm);
    const w = Number(widthCm);
    const tpb = Number(tilesPerBox);

    if (!l || !w || !tpb) {
      return res.status(400).json({ error: 'Pour le carrelage, longueur, largeur et carreaux par caisse sont requis.' });
    }

    const surfacePerTile = (l * w) / 10000;
    const surfacePerBox = surfacePerTile * tpb;
    const initialBoxes = Number(stockInitial) || 0;
    const totalTiles = initialBoxes * tpb;
    finalStockQuantity = totalTiles;

    const basis: 'm2' | 'caisse' = priceBasis === 'caisse' ? 'caisse' : 'm2';
    const pAchat = Number(prixAchat) || 0;
    const pVente = Number(prixVente) || 0;

    const purchasePricePerM2 = basis === 'm2' ? pAchat : (surfacePerBox > 0 ? pAchat / surfacePerBox : 0);
    const sellingPricePerM2 = basis === 'm2' ? pVente : (surfacePerBox > 0 ? pVente / surfacePerBox : 0);

    const purchaseCostPerBox = basis === 'caisse' ? pAchat : pAchat * surfacePerBox;
    const sellingPricePerBox = basis === 'caisse' ? pVente : pVente * surfacePerBox;

    computedCarrelageDetails = {
      lengthCm: l,
      widthCm: w,
      tilesPerBox: tpb,
      surfacePerTile: Number(surfacePerTile.toFixed(4)),
      surfacePerBox: Number(surfacePerBox.toFixed(4)),
      boxesInStock: initialBoxes,
      looseTilesInStock: 0,
      totalTilesInStock: totalTiles,
      totalSurfaceM2: Number((totalTiles * surfacePerTile).toFixed(3)),
      priceBasis: basis,
      purchasePricePerM2: Number(purchasePricePerM2.toFixed(2)),
      sellingPricePerM2: Number(sellingPricePerM2.toFixed(2)),
      purchaseCostPerBox: Number(purchaseCostPerBox.toFixed(2)),
      sellingPricePerBox: Number(sellingPricePerBox.toFixed(2)),
    };
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: 'prod_' + crypto.randomUUID().slice(0, 8),
    designation: designation.trim(),
    reference: reference.trim(),
    categoryId,
    productType,
    description: description?.trim() || '',
    prixAchat: Number(prixAchat) || 0,
    prixVente: Number(prixVente) || 0,
    stockQuantity: finalStockQuantity,
    stockMin: Number(stockMin) || 0,
    supplierId: supplierId || undefined,
    barcode: barcode?.trim() || undefined,
    imageUrl: imageUrl || undefined,
    origin: origin === 'importation' ? 'importation' : 'local',
    active: true,
    isArchived: false,
    carrelageDetails: computedCarrelageDetails,
    createdAt: now,
    updatedAt: now,
  };

  db.transaction((state) => {
    state.products.push(newProduct);

    // If initial stock > 0, record initial stock movement
    if (finalStockQuantity > 0) {
      const movement: StockMovement = {
        id: 'mvt_' + crypto.randomUUID().slice(0, 8),
        productId: newProduct.id,
        productDesignation: newProduct.designation,
        productReference: newProduct.reference,
        date: now,
        quantityBefore: 0,
        quantityChanged: finalStockQuantity,
        quantityAfter: finalStockQuantity,
        movementType: 'initial',
        userName: req.user?.name || 'Admin',
        reason: productType === 'carrelage'
          ? `Stock initial: ${computedCarrelageDetails?.boxesInStock} caisses (${finalStockQuantity} carreaux, ${computedCarrelageDetails?.totalSurfaceM2} m²)`
          : `Stock initial: ${finalStockQuantity} pièces`,
        createdAt: now,
      };
      state.stockMovements.unshift(movement);
    }
  });

  recordAudit(req, 'CREATE_PRODUCT', 'PRODUCT', newProduct.id, `Création du produit ${newProduct.designation} (${newProduct.reference})`);
  return res.json(newProduct);
});

apiRouter.put('/products/:id', checkSectionPermission('products'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    designation,
    reference,
    categoryId,
    origin,
    description,
    prixAchat,
    prixVente,
    stockMin,
    supplierId,
    barcode,
    imageUrl,
    active,
    // Carrelage edits
    lengthCm,
    widthCm,
    tilesPerBox,
    priceBasis,
  } = req.body;

  db.transaction((state) => {
    const prod = state.products.find((p) => p.id === id);
    if (!prod) throw new Error('Produit introuvable.');

    // Check duplicate reference if changed
    if (reference && reference.trim().toLowerCase() !== prod.reference.toLowerCase()) {
      const duplicate = state.products.find((p) => p.reference.toLowerCase() === reference.trim().toLowerCase() && p.id !== id && !p.isArchived);
      if (duplicate) throw new Error(`La référence "${reference}" est déjà utilisée.`);
      prod.reference = reference.trim();
    }

    if (designation) prod.designation = designation.trim();
    if (categoryId) prod.categoryId = categoryId;
    if (origin !== undefined) prod.origin = origin === 'importation' ? 'importation' : 'local';
    if (description !== undefined) prod.description = description.trim();
    if (prixAchat !== undefined) prod.prixAchat = Number(prixAchat);
    if (prixVente !== undefined) prod.prixVente = Number(prixVente);
    if (stockMin !== undefined) prod.stockMin = Number(stockMin);
    if (supplierId !== undefined) prod.supplierId = supplierId || undefined;
    if (barcode !== undefined) prod.barcode = barcode.trim() || undefined;
    if (imageUrl !== undefined) prod.imageUrl = imageUrl || undefined;
    if (active !== undefined) prod.active = !!active;

    if (prod.productType === 'carrelage' && prod.carrelageDetails) {
      const l = lengthCm ? Number(lengthCm) : prod.carrelageDetails.lengthCm;
      const w = widthCm ? Number(widthCm) : prod.carrelageDetails.widthCm;
      const tpb = tilesPerBox ? Number(tilesPerBox) : prod.carrelageDetails.tilesPerBox;
      const surfacePerTile = (l * w) / 10000;
      const surfacePerBox = surfacePerTile * tpb;
      const basis: 'm2' | 'caisse' = (priceBasis === 'caisse' || (!priceBasis && prod.carrelageDetails.priceBasis === 'caisse')) ? 'caisse' : 'm2';

      const pAchat = prod.prixAchat;
      const pVente = prod.prixVente;

      const purchasePricePerM2 = basis === 'm2' ? pAchat : (surfacePerBox > 0 ? pAchat / surfacePerBox : 0);
      const sellingPricePerM2 = basis === 'm2' ? pVente : (surfacePerBox > 0 ? pVente / surfacePerBox : 0);
      const purchaseCostPerBox = basis === 'caisse' ? pAchat : pAchat * surfacePerBox;
      const sellingPricePerBox = basis === 'caisse' ? pVente : pVente * surfacePerBox;

      const totalTiles = prod.stockQuantity;
      const boxes = Math.floor(totalTiles / tpb);
      const loose = totalTiles % tpb;

      prod.carrelageDetails = {
        lengthCm: l,
        widthCm: w,
        tilesPerBox: tpb,
        surfacePerTile: Number(surfacePerTile.toFixed(4)),
        surfacePerBox: Number(surfacePerBox.toFixed(4)),
        boxesInStock: boxes,
        looseTilesInStock: loose,
        totalTilesInStock: totalTiles,
        totalSurfaceM2: Number((totalTiles * surfacePerTile).toFixed(3)),
        priceBasis: basis,
        purchasePricePerM2: Number(purchasePricePerM2.toFixed(2)),
        sellingPricePerM2: Number(sellingPricePerM2.toFixed(2)),
        purchaseCostPerBox: Number(purchaseCostPerBox.toFixed(2)),
        sellingPricePerBox: Number(sellingPricePerBox.toFixed(2)),
      };
    }

    prod.updatedAt = new Date().toISOString();
  });

  recordAudit(req, 'UPDATE_PRODUCT', 'PRODUCT', id, `Mise à jour du produit ${designation || id}`);
  return res.json({ success: true, message: 'Produit mis à jour avec succès.' });
});

apiRouter.delete('/products/:id', checkSectionPermission('products'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Soft delete / archive to preserve historical sales & purchase documents
  db.transaction((state) => {
    const prod = state.products.find((p) => p.id === id);
    if (!prod) throw new Error('Produit introuvable.');
    prod.isArchived = true;
    prod.active = false;
    prod.updatedAt = new Date().toISOString();
  });

  recordAudit(req, 'ARCHIVE_PRODUCT', 'PRODUCT', id, `Archivage sécurisé du produit ${id}`);
  return res.json({ success: true, message: 'Produit archivé avec succès (historique préservé).' });
});

// -------------------------------------------------------------
// INVENTORY & STOCK MOVEMENTS
// -------------------------------------------------------------

apiRouter.get('/inventory/movements', checkSectionPermission('inventory'), (req, res) => {
  const { productId, type } = req.query;
  let movements = db.get('stockMovements');

  if (productId) {
    movements = movements.filter((m) => m.productId === productId);
  }
  if (type) {
    movements = movements.filter((m) => m.movementType === type);
  }

  return res.json(movements);
});

apiRouter.post('/inventory/adjustment', checkSectionPermission('inventory'), (req: AuthRequest, res: Response) => {
  const { productId, newQuantity, reason, movementType } = req.body;

  if (!productId || newQuantity === undefined || !reason || !reason.trim()) {
    return res.status(400).json({ error: 'Le produit, la nouvelle quantité et le motif obligatoire sont requis.' });
  }

  const targetQty = Number(newQuantity);
  if (isNaN(targetQty) || targetQty < 0) {
    return res.status(400).json({ error: 'La quantité doit être un nombre positif ou nul.' });
  }

  const now = new Date().toISOString();

  db.transaction((state) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Produit introuvable.');

    const before = prod.stockQuantity;
    const diff = targetQty - before;
    if (diff === 0) return; // No change

    prod.stockQuantity = targetQty;

    if (prod.productType === 'carrelage' && prod.carrelageDetails) {
      const tpb = prod.carrelageDetails.tilesPerBox;
      prod.carrelageDetails.boxesInStock = Math.floor(targetQty / tpb);
      prod.carrelageDetails.looseTilesInStock = targetQty % tpb;
      prod.carrelageDetails.totalTilesInStock = targetQty;
      prod.carrelageDetails.totalSurfaceM2 = Number((targetQty * prod.carrelageDetails.surfacePerTile).toFixed(3));
    }

    prod.updatedAt = now;

    const movement: StockMovement = {
      id: 'mvt_' + crypto.randomUUID().slice(0, 8),
      productId: prod.id,
      productDesignation: prod.designation,
      productReference: prod.reference,
      date: now,
      quantityBefore: before,
      quantityChanged: diff,
      quantityAfter: targetQty,
      movementType: movementType || 'correction',
      userName: req.user?.name || 'Admin',
      reason: reason.trim(),
      createdAt: now,
    };

    state.stockMovements.unshift(movement);
  });

  recordAudit(req, 'STOCK_ADJUSTMENT', 'PRODUCT', productId, `Ajustement de stock: ${targetQty} (motif: ${reason})`);
  return res.json({ success: true, message: 'Stock ajusté et mouvement enregistré.' });
});

// -------------------------------------------------------------
// SUPPLIERS & PURCHASES & SUPPLIER PAYMENTS
// -------------------------------------------------------------

apiRouter.get('/suppliers', checkSectionPermission('suppliers'), (req, res) => {
  return res.json(db.get('suppliers'));
});

apiRouter.post('/suppliers', checkSectionPermission('suppliers'), (req: AuthRequest, res: Response) => {
  const { name, contactPerson, phone, email, address, city, ice, ifCode, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Le nom du fournisseur et le téléphone sont obligatoires.' });
  }

  const supplier: Supplier = {
    id: 'sup_' + crypto.randomUUID().slice(0, 8),
    name: name.trim(),
    contactPerson: contactPerson?.trim() || '',
    phone: phone.trim(),
    email: email?.trim() || '',
    address: address?.trim() || '',
    city: city?.trim() || 'Casablanca',
    ice: ice?.trim() || '',
    ifCode: ifCode?.trim() || '',
    notes: notes?.trim() || '',
    active: true,
    totalPurchases: 0,
    totalPaid: 0,
    balanceDue: 0,
    createdAt: new Date().toISOString(),
  };

  db.transaction((state) => {
    state.suppliers.push(supplier);
  });

  recordAudit(req, 'CREATE_SUPPLIER', 'SUPPLIER', supplier.id, `Création du fournisseur ${supplier.name}`);
  return res.json(supplier);
});

apiRouter.put('/suppliers/:id', checkSectionPermission('suppliers'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = req.body;

  db.transaction((state) => {
    const s = state.suppliers.find((x) => x.id === id);
    if (!s) throw new Error('Fournisseur introuvable.');
    Object.assign(s, updated);
  });

  recordAudit(req, 'UPDATE_SUPPLIER', 'SUPPLIER', id, `Mise à jour du fournisseur ${id}`);
  return res.json({ success: true });
});

apiRouter.delete('/suppliers/:id', checkSectionPermission('suppliers'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const purchases = db.get('purchases');
  const count = purchases.filter((p) => p.supplierId === id).length;

  if (count > 0) {
    return res.status(400).json({ error: `Impossible de supprimer : ce fournisseur possède ${count} achat(s) enregistré(s).` });
  }

  db.transaction((state) => {
    state.suppliers = state.suppliers.filter((s) => s.id !== id);
  });

  recordAudit(req, 'DELETE_SUPPLIER', 'SUPPLIER', id, `Suppression du fournisseur ${id}`);
  return res.json({ success: true });
});

apiRouter.get('/suppliers/:id/details', checkSectionPermission('suppliers'), (req, res) => {
  const { id } = req.params;
  const suppliers = db.get('suppliers');
  const supplier = suppliers.find((s) => s.id === id);
  if (!supplier) return res.status(404).json({ error: 'Fournisseur introuvable.' });

  const purchases = db.get('purchases').filter((p) => p.supplierId === id);
  const payments = db.get('supplierPayments').filter((p) => p.supplierId === id);

  return res.json({
    supplier,
    purchases,
    payments,
  });
});

// Purchases
apiRouter.get('/purchases', checkSectionPermission('purchases'), (req, res) => {
  return res.json(db.get('purchases'));
});

apiRouter.post('/purchases', checkSectionPermission('purchases'), (req: AuthRequest, res: Response) => {
  const { supplierId, documentNumber, date, items, amountPaid, notes, tvaRate } = req.body;

  if (!supplierId || !items || !items.length) {
    return res.status(400).json({ error: 'Le fournisseur et au moins un article sont requis.' });
  }

  const now = new Date().toISOString();

  const result = db.transaction((state) => {
    const supplier = state.suppliers.find((s) => s.id === supplierId);
    if (!supplier) throw new Error('Fournisseur introuvable.');

    // Calculate totals
    let totalHT = 0;
    const processedItems = items.map((item: any) => {
      const prod = state.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Produit ${item.productId} introuvable.`);

      const unitPrice = Number(item.unitPrice) || prod.prixAchat;
      let qty = Number(item.quantity); // pieces or tiles
      let lineTotal = 0;

      if (prod.productType === 'carrelage' && prod.carrelageDetails) {
        // If user entered boxes, convert to tiles
        const boxesCount = Number(item.boxesCount) || 0;
        const looseCount = Number(item.looseTilesCount) || 0;
        const tpb = prod.carrelageDetails.tilesPerBox;
        qty = (boxesCount * tpb) + looseCount;
        const surfaceM2 = qty * prod.carrelageDetails.surfacePerTile;
        lineTotal = surfaceM2 * unitPrice;

        return {
          productId: prod.id,
          designation: prod.designation,
          reference: prod.reference,
          productType: prod.productType,
          quantity: qty,
          boxesCount,
          looseTilesCount: looseCount,
          surfaceM2: Number(surfaceM2.toFixed(3)),
          unitPrice,
          totalPrice: Number(lineTotal.toFixed(2)),
        };
      } else {
        lineTotal = qty * unitPrice;
        return {
          productId: prod.id,
          designation: prod.designation,
          reference: prod.reference,
          productType: prod.productType,
          quantity: qty,
          unitPrice,
          totalPrice: Number(lineTotal.toFixed(2)),
        };
      }
    });

    totalHT = processedItems.reduce((acc: number, it: any) => acc + it.totalPrice, 0);
    const rate = tvaRate !== undefined ? Number(tvaRate) : state.settings.defaultTvaRate;
    const tvaAmount = (totalHT * rate) / 100;
    const totalTTC = totalHT + tvaAmount;

    const paid = Number(amountPaid) || 0;
    const balanceDue = Math.max(0, totalTTC - paid);
    let paymentStatus: any = 'impaye';
    if (paid >= totalTTC) paymentStatus = 'paye';
    else if (paid > 0) paymentStatus = 'partiel';

    const docNum = documentNumber?.trim() || `BA-${new Date().getFullYear()}-${state.settings.nextPurchaseNumber}`;
    state.settings.nextPurchaseNumber += 1;

    const purchase: Purchase = {
      id: 'pur_' + crypto.randomUUID().slice(0, 8),
      documentNumber: docNum,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: date || new Date().toISOString().split('T')[0],
      items: processedItems,
      totalHT: Number(totalHT.toFixed(2)),
      tvaRate: rate,
      tvaAmount: Number(tvaAmount.toFixed(2)),
      totalTTC: Number(totalTTC.toFixed(2)),
      amountPaid: Number(paid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
      paymentStatus,
      notes: notes?.trim() || '',
      createdAt: now,
    };

    state.purchases.unshift(purchase);

    // Update product stock and record stock movements
    for (const it of processedItems) {
      const prod = state.products.find((p) => p.id === it.productId);
      if (prod) {
        const qtyBefore = prod.stockQuantity;
        prod.stockQuantity += it.quantity;

        if (prod.productType === 'carrelage' && prod.carrelageDetails) {
          const tpb = prod.carrelageDetails.tilesPerBox;
          prod.carrelageDetails.boxesInStock = Math.floor(prod.stockQuantity / tpb);
          prod.carrelageDetails.looseTilesInStock = prod.stockQuantity % tpb;
          prod.carrelageDetails.totalTilesInStock = prod.stockQuantity;
          prod.carrelageDetails.totalSurfaceM2 = Number((prod.stockQuantity * prod.carrelageDetails.surfacePerTile).toFixed(3));
        }

        prod.updatedAt = now;

        const mvt: StockMovement = {
          id: 'mvt_' + crypto.randomUUID().slice(0, 8),
          productId: prod.id,
          productDesignation: prod.designation,
          productReference: prod.reference,
          date: now,
          quantityBefore: qtyBefore,
          quantityChanged: it.quantity,
          quantityAfter: prod.stockQuantity,
          movementType: 'achat',
          referenceId: purchase.id,
          userName: req.user?.name || 'Admin',
          reason: `Achat fournisseur ${docNum} (${supplier.name})`,
          createdAt: now,
        };
        state.stockMovements.unshift(mvt);
      }
    }

    // Update supplier balance
    supplier.totalPurchases += totalTTC;
    supplier.totalPaid += paid;
    supplier.balanceDue = Math.max(0, supplier.totalPurchases - supplier.totalPaid);

    // If paid > 0, record payment entry
    if (paid > 0) {
      const payment: SupplierPayment = {
        id: 'sp_' + crypto.randomUUID().slice(0, 8),
        supplierId: supplier.id,
        supplierName: supplier.name,
        purchaseId: purchase.id,
        amount: paid,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: req.body.paymentMethod || 'especes',
        paymentReference: req.body.paymentReference || docNum,
        notes: `Règlement initial achat ${docNum}`,
        createdByName: req.user?.name || 'Admin',
        createdAt: now,
      };
      state.supplierPayments.unshift(payment);
    }

    return purchase;
  });

  recordAudit(req, 'CREATE_PURCHASE', 'PURCHASE', result.id, `Achat fournisseur ${result.documentNumber} (${result.supplierName}) : ${result.totalTTC} DH`);
  return res.json(result);
});

// Supplier Payments
apiRouter.get('/supplier-payments', checkSectionPermission('supplierPayments'), (req, res) => {
  return res.json(db.get('supplierPayments'));
});

apiRouter.post('/supplier-payments', checkSectionPermission('supplierPayments'), (req: AuthRequest, res: Response) => {
  const { supplierId, purchaseId, amount, date, paymentMethod, paymentReference, notes } = req.body;

  if (!supplierId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Le fournisseur et un montant valide sont obligatoires.' });
  }

  const payAmount = Number(amount);
  const now = new Date().toISOString();

  const payment = db.transaction((state) => {
    const supplier = state.suppliers.find((s) => s.id === supplierId);
    if (!supplier) throw new Error('Fournisseur introuvable.');

    // If allocated to a purchase
    if (purchaseId) {
      const purchase = state.purchases.find((p) => p.id === purchaseId);
      if (purchase) {
        purchase.amountPaid += payAmount;
        purchase.balanceDue = Math.max(0, purchase.totalTTC - purchase.amountPaid);
        if (purchase.amountPaid >= purchase.totalTTC) purchase.paymentStatus = 'paye';
        else if (purchase.amountPaid > 0) purchase.paymentStatus = 'partiel';
      }
    } else {
      // Allocate to oldest unpaid invoices of this supplier
      let remaining = payAmount;
      const unpaid = state.purchases
        .filter((p) => p.supplierId === supplierId && p.balanceDue > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const pur of unpaid) {
        if (remaining <= 0) break;
        const alloc = Math.min(remaining, pur.balanceDue);
        pur.amountPaid += alloc;
        pur.balanceDue = Math.max(0, pur.totalTTC - pur.amountPaid);
        if (pur.amountPaid >= pur.totalTTC) pur.paymentStatus = 'paye';
        else pur.paymentStatus = 'partiel';
        remaining -= alloc;
      }
    }

    supplier.totalPaid += payAmount;
    supplier.balanceDue = Math.max(0, supplier.totalPurchases - supplier.totalPaid);

    const newPayment: SupplierPayment = {
      id: 'sp_' + crypto.randomUUID().slice(0, 8),
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseId: purchaseId || undefined,
      amount: payAmount,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'especes',
      paymentReference: paymentReference?.trim() || undefined,
      notes: notes?.trim() || '',
      createdByName: req.user?.name || 'Admin',
      createdAt: now,
    };

    state.supplierPayments.unshift(newPayment);
    return newPayment;
  });

  recordAudit(req, 'SUPPLIER_PAYMENT', 'SUPPLIER', supplierId, `Règlement fournisseur de ${payAmount} DH à ${payment.supplierName}`);
  return res.json(payment);
});

// -------------------------------------------------------------
// CLIENTS & CLIENT BALANCES
// -------------------------------------------------------------

apiRouter.get('/clients', checkSectionPermission('clients'), (req, res) => {
  return res.json(db.get('clients'));
});

apiRouter.post('/clients', checkSectionPermission('clients'), (req: AuthRequest, res: Response) => {
  const { name, clientType, phone, email, address, city, ice, ifCode, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Le nom du client est obligatoire.' });
  }

  const client: Client = {
    id: 'cli_' + crypto.randomUUID().slice(0, 8),
    clientType: clientType || 'particulier',
    name: name.trim(),
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    address: address?.trim() || '',
    city: city?.trim() || 'Casablanca',
    ice: ice?.trim() || '',
    ifCode: ifCode?.trim() || '',
    notes: notes?.trim() || '',
    totalSales: 0,
    totalPaid: 0,
    balanceDue: 0,
    createdAt: new Date().toISOString(),
  };

  db.transaction((state) => {
    state.clients.push(client);
  });

  recordAudit(req, 'CREATE_CLIENT', 'CLIENT', client.id, `Création du client ${client.name}`);
  return res.json(client);
});

apiRouter.put('/clients/:id', checkSectionPermission('clients'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = req.body;

  db.transaction((state) => {
    const c = state.clients.find((x) => x.id === id);
    if (!c) throw new Error('Client introuvable.');
    Object.assign(c, updated);
  });

  recordAudit(req, 'UPDATE_CLIENT', 'CLIENT', id, `Mise à jour du client ${id}`);
  return res.json({ success: true });
});

apiRouter.delete('/clients/:id', checkSectionPermission('clients'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const sales = db.get('sales');
  const count = sales.filter((s) => s.clientId === id).length;

  if (count > 0) {
    return res.status(400).json({ error: `Impossible de supprimer : ce client a ${count} vente(s) enregistrée(s).` });
  }

  db.transaction((state) => {
    state.clients = state.clients.filter((c) => c.id !== id);
  });

  recordAudit(req, 'DELETE_CLIENT', 'CLIENT', id, `Suppression du client ${id}`);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// SALES SYSTEM & CARRELAGE POS (CRITICAL TRANSACTIONAL ENGINE)
// -------------------------------------------------------------

apiRouter.get('/sales', checkSectionPermission('pos'), (req, res) => {
  return res.json(db.get('sales'));
});

apiRouter.post('/sales', checkSectionPermission('pos'), (req: AuthRequest, res: Response) => {
  const {
    clientId,
    clientName,
    clientPhone,
    clientAddress,
    clientIce,
    items,
    discountTotal,
    applyTva,
    paymentMethod,
    amountPaid,
    notes,
    generateFacture,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'La vente doit comporter au moins un produit.' });
  }

  const now = new Date().toISOString();

  try {
    const sale = db.transaction((state) => {
      // 1. Process items, validate stock, compute calculations
      let totalHT = 0;
      const processedItems = items.map((raw: any) => {
        const prod = state.products.find((p) => p.id === raw.productId);
        if (!prod || prod.isArchived) {
          throw new Error(`Produit introuvable ou archivé: ${raw.productId}`);
        }

        const unitPrice = Number(raw.unitPrice) || prod.prixVente;
        const discountPct = Number(raw.discountPercent) || 0;

        if (prod.productType === 'carrelage' && prod.carrelageDetails) {
          const requestedM2 = Number(raw.requestedM2) || Number(raw.quantity) || 0;
          const tpb = prod.carrelageDetails.tilesPerBox;
          const spt = prod.carrelageDetails.surfacePerTile;
          const spb = prod.carrelageDetails.surfacePerBox;

          // Selling modes:
          // Policy: exact_tile: user requires requestedM2, calculate required tiles = ceil(requestedM2 / spt)
          // or complete_box: round up to complete boxes
          let totalTilesNeeded = 0;
          let boxesCount = 0;
          let looseTiles = 0;
          let suppliedSurface = 0;

          if (raw.sellByBoxOnly) {
            boxesCount = Math.max(1, Math.ceil(requestedM2 / spb));
            looseTiles = 0;
            totalTilesNeeded = boxesCount * tpb;
            suppliedSurface = Number((boxesCount * spb).toFixed(3));
          } else {
            totalTilesNeeded = Math.max(1, Math.ceil(requestedM2 / spt));
            boxesCount = Math.floor(totalTilesNeeded / tpb);
            looseTiles = totalTilesNeeded % tpb;
            suppliedSurface = Number((totalTilesNeeded * spt).toFixed(3));
          }

          // Check stock
          if (!state.settings.allowNegativeStock && prod.stockQuantity < totalTilesNeeded) {
            const availBoxes = Math.floor(prod.stockQuantity / tpb);
            const availLoose = prod.stockQuantity % tpb;
            const availM2 = (prod.stockQuantity * spt).toFixed(2);
            throw new Error(`Stock insuffisant pour "${prod.designation}". Disponible: ${availBoxes} caisses + ${availLoose} carreaux (${availM2} m²). Requis: ${totalTilesNeeded} carreaux.`);
          }

          // Price calculation based on billed surface (supplied or requested)
          // Prompt requirement: "never silently overcharge a customer when exact surface is requested"
          const billedSurface = raw.chargeSuppliedSurface ? suppliedSurface : requestedM2;
          const baseLineTotal = billedSurface * unitPrice;
          const discountedTotal = baseLineTotal * (1 - discountPct / 100);

          return {
            productId: prod.id,
            designation: prod.designation,
            reference: prod.reference,
            productType: prod.productType,
            dimensions: `${prod.carrelageDetails.lengthCm}x${prod.carrelageDetails.widthCm} cm`,
            requestedM2,
            boxesCount,
            looseTilesCount: looseTiles,
            totalTiles: totalTilesNeeded,
            suppliedSurfaceM2: suppliedSurface,
            surfacePerBox: spb,
            quantity: billedSurface, // Quantity in m²
            unitPrice,
            purchaseUnitPrice: prod.carrelageDetails.purchasePricePerM2,
            discountPercent: discountPct,
            totalPrice: Number(discountedTotal.toFixed(2)),
          };
        } else {
          // Standard piece or non-carrelage product
          const qty = Number(raw.quantity) || 1;
          if (!state.settings.allowNegativeStock && prod.stockQuantity < qty) {
            throw new Error(`Stock insuffisant pour "${prod.designation}". Disponible: ${prod.stockQuantity} pièces. Requis: ${qty}.`);
          }

          const baseLineTotal = qty * unitPrice;
          const discountedTotal = baseLineTotal * (1 - discountPct / 100);

          return {
            productId: prod.id,
            designation: prod.designation,
            reference: prod.reference,
            productType: prod.productType,
            quantity: qty,
            unitPrice,
            purchaseUnitPrice: prod.prixAchat,
            discountPercent: discountPct,
            totalPrice: Number(discountedTotal.toFixed(2)),
          };
        }
      });

      totalHT = processedItems.reduce((acc: number, it: any) => acc + it.totalPrice, 0);
      const discount = Number(discountTotal) || 0;
      const discountedHT = Math.max(0, totalHT - discount);

      const tvaRate = applyTva ? state.settings.defaultTvaRate : 0;
      const tvaAmount = (discountedHT * tvaRate) / 100;
      const netAPayer = discountedHT + tvaAmount;

      const paid = Number(amountPaid) >= 0 ? Number(amountPaid) : netAPayer;
      const changeDue = Math.max(0, paid - netAPayer);
      const balanceDue = Math.max(0, netAPayer - paid);

      let paymentStatus: any = 'impaye';
      if (balanceDue === 0) paymentStatus = 'paye';
      else if (paid > 0) paymentStatus = 'partiel';

      // Document Numbers: Always generate sequential 7-digit numbers for both BL and Facture
      const paddedBl = String(state.settings.nextBlNumber || 1).padStart(7, '0');
      const blNum = `BL-${paddedBl}`;
      state.settings.nextBlNumber = (state.settings.nextBlNumber || 1) + 1;

      const paddedFac = String(state.settings.nextFactureNumber || 1).padStart(7, '0');
      const facNum = `FAC-${paddedFac}`;
      state.settings.nextFactureNumber = (state.settings.nextFactureNumber || 1) + 1;

      // Decrement stock and log movements
      for (const item of processedItems) {
        const prod = state.products.find((p) => p.id === item.productId);
        if (prod) {
          const qtyBefore = prod.stockQuantity;
          const deduct = item.productType === 'carrelage' ? (item.totalTiles || 0) : item.quantity;
          prod.stockQuantity -= deduct;

          if (prod.productType === 'carrelage' && prod.carrelageDetails) {
            const tpb = prod.carrelageDetails.tilesPerBox;
            prod.carrelageDetails.boxesInStock = Math.floor(prod.stockQuantity / tpb);
            prod.carrelageDetails.looseTilesInStock = prod.stockQuantity % tpb;
            prod.carrelageDetails.totalTilesInStock = prod.stockQuantity;
            prod.carrelageDetails.totalSurfaceM2 = Number((prod.stockQuantity * prod.carrelageDetails.surfacePerTile).toFixed(3));
          }

          prod.updatedAt = now;

          const mvt: StockMovement = {
            id: 'mvt_' + crypto.randomUUID().slice(0, 8),
            productId: prod.id,
            productDesignation: prod.designation,
            productReference: prod.reference,
            date: now,
            quantityBefore: qtyBefore,
            quantityChanged: -deduct,
            quantityAfter: prod.stockQuantity,
            movementType: 'vente',
            referenceId: blNum,
            userName: req.user?.name || 'Admin',
            reason: `Vente client ${blNum} (${clientName || 'Comptoir'})`,
            createdAt: now,
          };
          state.stockMovements.unshift(mvt);
        }
      }

      // Update client if registered
      if (clientId) {
        const client = state.clients.find((c) => c.id === clientId);
        if (client) {
          client.totalSales += netAPayer;
          client.totalPaid += Math.min(paid, netAPayer);
          client.balanceDue = Math.max(0, client.totalSales - client.totalPaid);
        }
      }

      const newSale: Sale = {
        id: 'sale_' + crypto.randomUUID().slice(0, 8),
        bonLivraisonNumber: blNum,
        factureNumber: facNum,
        clientId: clientId || undefined,
        clientName: clientName?.trim() || 'Client de passage',
        clientPhone: clientPhone?.trim() || undefined,
        clientAddress: clientAddress?.trim() || undefined,
        clientIce: clientIce?.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
        items: processedItems,
        totalHT: Number(discountedHT.toFixed(2)),
        tvaRate,
        tvaAmount: Number(tvaAmount.toFixed(2)),
        discountTotal: Number(discount.toFixed(2)),
        netAPayer: Number(netAPayer.toFixed(2)),
        amountPaid: Number(paid.toFixed(2)),
        changeDue: Number(changeDue.toFixed(2)),
        balanceDue: Number(balanceDue.toFixed(2)),
        paymentMethod: paymentMethod || 'especes',
        paymentStatus,
        notes: notes?.trim() || '',
        createdByName: req.user?.name || 'Admin',
        createdAt: now,
      };

      state.sales.unshift(newSale);
      return newSale;
    });

    recordAudit(req, 'CREATE_SALE', 'SALE', sale.id, `Vente effectuée : ${sale.bonLivraisonNumber} (${sale.clientName}) pour un total de ${sale.netAPayer} DH`);
    return res.json(sale);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur lors de l’enregistrement de la vente.' });
  }
});

// Sale cancellation / return with audit and stock restoration
apiRouter.post('/sales/:id/cancel', checkSectionPermission('pos'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Le motif d’annulation est obligatoire.' });
  }

  const now = new Date().toISOString();

  try {
    db.transaction((state) => {
      const sale = state.sales.find((s) => s.id === id);
      if (!sale) throw new Error('Vente introuvable.');
      if (sale.isCancelled) throw new Error('Cette vente a déjà été annulée.');

      sale.isCancelled = true;
      sale.cancelReason = reason.trim();
      sale.cancelledAt = now;
      sale.cancelledBy = req.user?.name || 'Admin';

      // Restore stock for all items
      for (const item of sale.items) {
        const prod = state.products.find((p) => p.id === item.productId);
        if (prod) {
          const qtyBefore = prod.stockQuantity;
          const restoreQty = item.productType === 'carrelage' ? (item.totalTiles || 0) : item.quantity;
          prod.stockQuantity += restoreQty;

          if (prod.productType === 'carrelage' && prod.carrelageDetails) {
            const tpb = prod.carrelageDetails.tilesPerBox;
            prod.carrelageDetails.boxesInStock = Math.floor(prod.stockQuantity / tpb);
            prod.carrelageDetails.looseTilesInStock = prod.stockQuantity % tpb;
            prod.carrelageDetails.totalTilesInStock = prod.stockQuantity;
            prod.carrelageDetails.totalSurfaceM2 = Number((prod.stockQuantity * prod.carrelageDetails.surfacePerTile).toFixed(3));
          }

          prod.updatedAt = now;

          const mvt: StockMovement = {
            id: 'mvt_' + crypto.randomUUID().slice(0, 8),
            productId: prod.id,
            productDesignation: prod.designation,
            productReference: prod.reference,
            date: now,
            quantityBefore: qtyBefore,
            quantityChanged: restoreQty,
            quantityAfter: prod.stockQuantity,
            movementType: 'annulation_vente',
            referenceId: sale.bonLivraisonNumber,
            userName: req.user?.name || 'Admin',
            reason: `Annulation vente ${sale.bonLivraisonNumber}: ${reason.trim()}`,
            createdAt: now,
          };
          state.stockMovements.unshift(mvt);
        }
      }

      // Revert client balances if registered
      if (sale.clientId) {
        const client = state.clients.find((c) => c.id === sale.clientId);
        if (client) {
          client.totalSales = Math.max(0, client.totalSales - sale.netAPayer);
          client.totalPaid = Math.max(0, client.totalPaid - (sale.netAPayer - sale.balanceDue));
          client.balanceDue = Math.max(0, client.totalSales - client.totalPaid);
        }
      }
    });

    recordAudit(req, 'CANCEL_SALE', 'SALE', id, `Annulation de la vente ${id} (motif: ${reason})`);
    return res.json({ success: true, message: 'Vente annulée avec succès. Le stock a été réintégré.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erreur lors de l’annulation.' });
  }
});

// -------------------------------------------------------------
// DASHBOARD & REAL-TIME STATS (DATABASE CALCULATED)
// -------------------------------------------------------------

apiRouter.get('/dashboard/stats', checkSectionPermission('dashboard'), (req, res) => {
  const products = db.get('products').filter((p) => !p.isArchived);
  const sales = db.get('sales').filter((s) => !s.isCancelled);
  const purchases = db.get('purchases');
  const suppliers = db.get('suppliers').filter((s) => s.active);
  const clients = db.get('clients');
  const payments = db.get('supplierPayments');

  // Today & Month date ranges
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

  // Product counts & valuations
  let totalStockQuantity = 0;
  let totalStockSurfaceM2 = 0;
  let stockPurchaseValuation = 0;
  let stockSellingValuation = 0;
  let productsLowStock = 0;
  let productsOutOfStock = 0;

  for (const p of products) {
    totalStockQuantity += p.stockQuantity;

    if (p.productType === 'carrelage' && p.carrelageDetails) {
      const surface = p.carrelageDetails.totalSurfaceM2;
      totalStockSurfaceM2 += surface;
      stockPurchaseValuation += surface * p.carrelageDetails.purchasePricePerM2;
      stockSellingValuation += surface * p.carrelageDetails.sellingPricePerM2;
    } else {
      stockPurchaseValuation += p.stockQuantity * p.prixAchat;
      stockSellingValuation += p.stockQuantity * p.prixVente;
    }

    if (p.stockQuantity <= 0) {
      productsOutOfStock += 1;
    } else if (p.stockQuantity <= p.stockMin) {
      productsLowStock += 1;
    }
  }

  // Sales totals
  let salesToday = 0;
  let salesCurrentMonth = 0;

  for (const s of sales) {
    if (s.date === todayStr) {
      salesToday += s.netAPayer;
    }
    if (s.date.startsWith(currentMonthPrefix)) {
      salesCurrentMonth += s.netAPayer;
    }
  }

  // Purchases total
  let purchasesCurrentMonth = 0;
  for (const pu of purchases) {
    if (pu.date.startsWith(currentMonthPrefix)) {
      purchasesCurrentMonth += pu.totalTTC;
    }
  }

  // Debts and credits
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + s.balanceDue, 0);
  const totalClientCredit = clients.reduce((acc, c) => acc + c.balanceDue, 0);
  const paymentsMadeToSuppliers = payments.reduce((acc, p) => acc + p.amount, 0);

  // Daily sales for last 7 days
  const salesByDayMap = new Map<string, { amount: number; count: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    salesByDayMap.set(dateStr, { amount: 0, count: 0 });
  }

  for (const s of sales) {
    if (salesByDayMap.has(s.date)) {
      const entry = salesByDayMap.get(s.date)!;
      entry.amount += s.netAPayer;
      entry.count += 1;
    }
  }

  const salesByDay = Array.from(salesByDayMap.entries()).map(([date, data]) => ({
    date,
    amount: Number(data.amount.toFixed(2)),
    count: data.count,
  }));

  // Sales by Category
  const catMap = new Map<string, { amount: number; count: number }>();
  const categories = db.get('categories');
  const catNameById = new Map(categories.map((c) => [c.id, c.name]));

  for (const s of sales) {
    for (const item of s.items) {
      const prod = products.find((p) => p.id === item.productId);
      const catName = (prod && catNameById.get(prod.categoryId)) || 'Divers';
      const cur = catMap.get(catName) || { amount: 0, count: 0 };
      cur.amount += item.totalPrice;
      cur.count += 1;
      catMap.set(catName, cur);
    }
  }

  const salesByCategory = Array.from(catMap.entries()).map(([category, val]) => ({
    category,
    amount: Number(val.amount.toFixed(2)),
    count: val.count,
  }));

  // Top selling products
  const topProdMap = new Map<string, { designation: string; reference: string; quantity: number; revenue: number }>();
  for (const s of sales) {
    for (const item of s.items) {
      const cur = topProdMap.get(item.productId) || {
        designation: item.designation,
        reference: item.reference,
        quantity: 0,
        revenue: 0,
      };
      cur.quantity += item.quantity;
      cur.revenue += item.totalPrice;
      topProdMap.set(item.productId, cur);
    }
  }

  const topSellingProducts = Array.from(topProdMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      revenue: Number(p.revenue.toFixed(2)),
      quantity: Number(p.quantity.toFixed(2)),
    }));

  return res.json({
    totalActiveProducts: products.length,
    productsLowStock,
    productsOutOfStock,
    totalStockQuantity,
    totalStockSurfaceM2: Number(totalStockSurfaceM2.toFixed(2)),
    stockPurchaseValuation: Number(stockPurchaseValuation.toFixed(2)),
    stockSellingValuation: Number(stockSellingValuation.toFixed(2)),
    salesToday: Number(salesToday.toFixed(2)),
    salesCurrentMonth: Number(salesCurrentMonth.toFixed(2)),
    purchasesCurrentMonth: Number(purchasesCurrentMonth.toFixed(2)),
    totalSupplierDebt: Number(totalSupplierDebt.toFixed(2)),
    totalClientCredit: Number(totalClientCredit.toFixed(2)),
    paymentsMadeToSuppliers: Number(paymentsMadeToSuppliers.toFixed(2)),
    recentSales: sales.slice(0, 5),
    recentPurchases: purchases.slice(0, 5),
    salesByDay,
    salesByCategory,
    topSellingProducts,
  });
});

// -------------------------------------------------------------
// REPORTS & FINANCIAL OVERVIEW
// -------------------------------------------------------------

apiRouter.get('/reports', checkSectionPermission('reports'), (req, res) => {
  const { startDate, endDate, categoryId } = req.query;

  let sales = db.get('sales').filter((s) => !s.isCancelled);
  let purchases = db.get('purchases');
  let products = db.get('products');
  const suppliers = db.get('suppliers');
  const clients = db.get('clients');

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => s.date >= startDate);
    purchases = purchases.filter((p) => p.date >= startDate);
  }

  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => s.date <= endDate);
    purchases = purchases.filter((p) => p.date <= endDate);
  }

  // Profitability calculations based on actual historical purchase costs
  let totalRevenue = 0;
  let totalCostOfGoodsSold = 0;

  for (const s of sales) {
    totalRevenue += s.totalHT;
    for (const item of s.items) {
      const cost = item.purchaseUnitPrice * item.quantity;
      totalCostOfGoodsSold += cost;
    }
  }

  const grossMargin = totalRevenue - totalCostOfGoodsSold;
  const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.totalTTC, 0);
  const totalPurchasesPaid = purchases.reduce((acc, p) => acc + p.amountPaid, 0);

  return res.json({
    period: { startDate, endDate },
    salesSummary: {
      count: sales.length,
      totalHT: Number(totalRevenue.toFixed(2)),
      totalTTC: Number(sales.reduce((acc, s) => acc + s.netAPayer, 0).toFixed(2)),
      costOfGoodsSold: Number(totalCostOfGoodsSold.toFixed(2)),
      grossMargin: Number(grossMargin.toFixed(2)),
      marginPercentage: Number(marginPercentage.toFixed(1)),
    },
    purchasesSummary: {
      count: purchases.length,
      totalAmount: Number(totalPurchasesAmount.toFixed(2)),
      totalPaid: Number(totalPurchasesPaid.toFixed(2)),
      remainingDue: Number((totalPurchasesAmount - totalPurchasesPaid).toFixed(2)),
    },
    supplierLiabilities: suppliers.map((s) => ({
      name: s.name,
      phone: s.phone,
      totalPurchases: s.totalPurchases,
      totalPaid: s.totalPaid,
      balanceDue: s.balanceDue,
    })),
    clientCredits: clients.filter((c) => c.balanceDue > 0).map((c) => ({
      name: c.name,
      phone: c.phone,
      totalSales: c.totalSales,
      totalPaid: c.totalPaid,
      balanceDue: c.balanceDue,
    })),
  });
});
