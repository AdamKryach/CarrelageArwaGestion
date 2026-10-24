import React, { useRef, useState } from 'react';
import { Sale, DocumentTemplate, StoreSettings } from '../../types';
import { Printer, Download, X, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocumentRendererProps {
  sale: Sale;
  type?: 'bon_livraison' | 'facture';
  template?: DocumentTemplate;
  settings: StoreSettings;
  onClose?: () => void;
}

// Elegant Moroccan arabesque tile logo matching the uploaded sample document
const CarrelageArwaTileLogo: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} shrink-0`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="12" fill="#f0fdfa" />
    {/* Interlocking geometric arabesque ribbons in teal / cyan */}
    <path
      d="M50 12 C 30 12, 12 30, 12 50 C 12 38, 28 28, 42 35 C 48 38, 50 44, 50 50 Z"
      fill="#0284c7"
      opacity="0.95"
    />
    <path
      d="M88 50 C 88 30, 70 12, 50 12 C 62 12, 72 28, 65 42 C 62 48, 56 50, 50 50 Z"
      fill="#0d9488"
      opacity="0.95"
    />
    <path
      d="M50 88 C 70 88, 88 70, 88 50 C 88 62, 72 72, 58 65 C 52 62, 50 56, 50 50 Z"
      fill="#0369a1"
      opacity="0.95"
    />
    <path
      d="M12 50 C 12 70, 30 88, 50 88 C 38 88, 28 72, 35 58 C 38 52, 44 50, 50 50 Z"
      fill="#0f766e"
      opacity="0.95"
    />
    {/* Inner decorative knot */}
    <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#0891b2" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="#0284c7" />
  </svg>
);

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  sale,
  type = 'bon_livraison',
  template,
  settings,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'bon_livraison' | 'facture'>(type);
  const [isExporting, setIsExporting] = useState(false);

  const isFacture = activeTab === 'facture';

  // Format date as DD/MM/YYYY matching uploaded sample (e.g. 07/10/2026)
  const formatSampleDate = (dateStr?: string) => {
    if (!dateStr) return '07/10/2026';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Format currency with French Moroccan notation (650,00)
  const formatMoney = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return Number(val)
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Format quantity (m² or count)
  const formatQty = (qty?: number) => {
    if (qty === undefined || qty === null) return '0';
    if (Number.isInteger(qty)) return qty.toString();
    return Number(qty).toFixed(2).replace('.', ',');
  };

  // Sequential 7-digit document number matching sample (e.g. "0000004")
  const rawBl = sale.bonLivraisonNumber || 'BL-0000001';
  const blDigits = rawBl.replace(/[^0-9]/g, '');
  const blSequence = blDigits ? blDigits.slice(-7).padStart(7, '0') : '0000001';

  const rawFac = sale.factureNumber || `FAC-${blSequence}`;
  const facDigits = rawFac.replace(/[^0-9]/g, '');
  const facSequence = facDigits ? facDigits.slice(-7).padStart(7, '0') : blSequence;

  const currentDocNumber = isFacture ? (sale.factureNumber || `FAC-${facSequence}`) : (sale.bonLivraisonNumber || `BL-${blSequence}`);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const isA4 = template?.paperSize === 'A4';
      const pdf = new jsPDF({
        orientation: template?.orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: isA4 ? 'a4' : 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentDocNumber}_${(sale.clientName || 'Client').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate blank grid filler rows to match the authentic uploaded sheet (around 8 to 10 rows total)
  const itemsCount = sale.items?.length || 0;
  const blankRowsNeeded = Math.max(0, 8 - itemsCount);
  const blankRows = Array.from({ length: blankRowsNeeded });

  // Totals
  const totalAmount = sale.netAPayer ?? sale.totalHT ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
        
        {/* TOP CONTROL TOOLBAR (Hidden in Print) */}
        {/* TOP CONTROL TOOLBAR (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
          {/* Switch Document Format Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('bon_livraison')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bon_livraison'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Bon de Livraison <span className="hidden md:inline">(Modèle Officiel Uploadé)</span></span>
            </button>

            <button
              onClick={() => setActiveTab('facture')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'facture'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Facture <span className="hidden md:inline">(Modèle Developer Portal)</span></span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isExporting ? 'Export...' : 'PDF'}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT VIEWPORT (Responsive horizontal scrolling on phone) */}
        <div className="overflow-x-auto overflow-y-auto p-2 sm:p-6 md:p-8 bg-slate-200/70 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          
          <div
            ref={printRef}
            id="printable-document"
            className="w-[148mm] min-h-[210mm] sm:w-[160mm] bg-white text-black shadow-lg print:shadow-none print:w-full print:max-w-none print:m-0 flex flex-col justify-between leading-normal p-6 sm:p-8 font-sans"
            style={{ minHeight: '210mm' }}
          >
            {/* ========================================================================= */}
            {/* 1. BON DE LIVRAISON : EXACT MODEL AS THE USER UPLOADED SAMPLE FILE         */}
            {/* ========================================================================= */}
            {!isFacture && (
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  {/* TOP HEADER SECTION */}
                  <div className="flex justify-between items-start mb-4">
                    {/* Left: Logo & Company details */}
                    <div className="flex items-center space-x-3.5 max-w-[62%]">
                      {template?.showLogo !== false && (
                        settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain shrink-0" />
                        ) : (
                          <CarrelageArwaTileLogo className="w-16 h-16 shrink-0" />
                        )
                      )}

                      <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-black tracking-wider text-black uppercase font-sans">
                          {settings.businessName || 'CARRELAGE ARWA'}
                        </h1>
                        <div className="w-full h-0.5 bg-black my-1" />
                        <div className="text-[11px] text-black space-y-0.5 font-medium leading-tight">
                          <p>{settings.address || 'Boulevard Ahmed Ben Hmad Dighoussi'}</p>
                          <p>{settings.city ? `2 Bis Lot Ratbia Zitoune ${settings.city}` : '2 Bis Lot Ratbia Zitoune Meknes'}</p>
                          <p>Gsm : {settings.phone || '0671152615'}</p>
                          <p>ICE : {settings.ice || '004027096000073'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Client Box matching uploaded sample */}
                    <div className="border border-black p-3 rounded-none w-52 sm:w-60 min-h-[85px] text-xs">
                      <div className="font-bold text-black text-sm mb-1">Client :</div>
                      <div className="font-semibold text-black text-xs">
                        {sale.clientName || 'Client Comptoir'}
                      </div>
                      {sale.clientPhone && (
                        <div className="text-[11px] text-black mt-0.5">Tél : {sale.clientPhone}</div>
                      )}
                      {sale.clientAddress && (
                        <div className="text-[11px] text-black truncate">{sale.clientAddress}</div>
                      )}
                      {sale.clientIce && (
                        <div className="text-[10px] text-black font-mono">ICE : {sale.clientIce}</div>
                      )}
                    </div>
                  </div>

                  {/* MIDDLE SECTION : DATE & NUMBER BOX (LEFT) + "Bon de Livraison" TITLE (RIGHT) */}
                  <div className="flex justify-between items-end mb-2 pt-2">
                    {/* Left Date & Number Box */}
                    <div className="border border-black p-2 rounded-none w-56 text-xs leading-snug">
                      <div className="font-bold text-black">Date :</div>
                      <div className="font-bold text-black text-xs">{formatSampleDate(sale.date)}</div>
                      <div className="font-bold text-black text-xs mt-0.5">
                        N° Bon de Livraison : <span className="font-mono">{blSequence}</span>
                      </div>
                    </div>

                    {/* Right Title */}
                    <div className="text-right">
                      <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight font-sans">
                        Bon de Livraison
                      </h2>
                    </div>
                  </div>

                  {/* Horizontal Rule under the Title spanning across */}
                  <div className="w-full h-0.5 bg-black mb-3" />

                  {/* PRODUCTS TABLE MATCHING UPLOADED SPECIFICATION */}
                  <div className="w-full">
                    <table className="w-full border-collapse border border-black text-xs font-sans">
                      <thead>
                        <tr className="border-b border-black text-black">
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[12%]">Quantité</th>
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[44%]">Désignation</th>
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[11%]">Caisse</th>
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[11%]">Carr.</th>
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[11%]">Prix. U</th>
                          <th className="border border-black py-1.5 px-2 font-bold text-center w-[11%]">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.items && sale.items.map((it, idx) => (
                          <tr key={idx} className="border-b border-black text-black">
                            <td className="border border-black py-2 px-2 text-center font-mono font-medium">
                              {formatQty(it.quantity)}
                            </td>
                            <td className="border border-black py-2 px-2 text-center">
                              <div className="font-medium text-black">{it.designation}</div>
                              {(it.reference || it.dimensions) && (
                                <div className="text-[11px] text-slate-700">
                                  {it.reference ? `Réf. ${it.reference}` : ''}
                                  {it.reference && it.dimensions ? ' · ' : ''}
                                  {it.dimensions ? it.dimensions : ''}
                                </div>
                              )}
                            </td>
                            <td className="border border-black py-2 px-2 text-center font-mono">
                              {it.boxesCount !== undefined && it.boxesCount > 0 ? it.boxesCount : '-'}
                            </td>
                            <td className="border border-black py-2 px-2 text-center font-mono">
                              {it.looseTilesCount !== undefined && it.looseTilesCount > 0
                                ? it.looseTilesCount
                                : it.totalTiles || '-'}
                            </td>
                            <td className="border border-black py-2 px-2 text-center font-mono">
                              {formatMoney(it.unitPrice)}
                            </td>
                            <td className="border border-black py-2 px-2 text-center font-mono font-bold">
                              {formatMoney(it.totalPrice)}
                            </td>
                          </tr>
                        ))}

                        {/* Blank Grid Rows to replicate authentic printed form */}
                        {blankRows.map((_, i) => (
                          <tr key={`blank-${i}`} className="border-b border-black h-7">
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                            <td className="border border-black py-1 px-2">&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* NET À PAYER SUMMARY BOX */}
                  <div className="border border-black flex justify-between items-center py-2 px-6 mt-3 bg-white">
                    <span className="font-bold text-base sm:text-lg text-black">
                      Net à Payer
                    </span>
                    <span className="font-black text-lg sm:text-xl text-black font-mono">
                      {formatMoney(totalAmount)} {settings.currency || 'DH'}
                    </span>
                  </div>
                </div>

                {/* CENTRED LEGAL NOTICE */}
                <div className="text-center text-[10.5px] italic text-slate-800 pt-4 leading-normal font-sans">
                  {settings.receiptFooterLegalText || 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.'}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. FACTURE : THE CUSTOMIZABLE DEVELOPER PORTAL MODEL                       */}
            {/* ========================================================================= */}
            {isFacture && (
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  {/* HEADER SECTION */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-3 mb-3">
                    <div className="space-y-1 max-w-[60%]">
                      <div className="flex items-center space-x-2">
                        {template?.showLogo !== false && (
                          settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain" />
                          ) : (
                            <div
                              className="w-9 h-9 rounded text-white font-bold flex items-center justify-center text-sm shadow-xs"
                              style={{ backgroundColor: template?.headerColor || '#0f172a' }}
                            >
                              CA
                            </div>
                          )
                        )}
                        <div>
                          <h1 className="font-black text-base tracking-tight text-slate-900 uppercase">
                            {settings.businessName || 'CARRELAGE ARWA'}
                          </h1>
                          <p className="text-[10px] text-slate-500 font-medium">Carrelage · Sanitaires · Robinetterie · Chauffe-eau</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-tight">
                        {settings.address}, {settings.city} · {settings.country || 'Maroc'}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        Tél : {settings.phone} {settings.email ? `· ${settings.email}` : ''}
                      </p>
                    </div>

                    {/* DOCUMENT BADGE & NUMBER */}
                    <div className="text-right space-y-1">
                      <div
                        className="inline-block text-white font-black px-3 py-1 rounded text-xs tracking-wider uppercase shadow-xs"
                        style={{ backgroundColor: template?.headerColor || '#0f172a' }}
                      >
                        {template?.title || 'FACTURE'}
                      </div>
                      <div className="font-mono font-bold text-xs" style={{ color: template?.headerColor || '#0f172a' }}>
                        N° Facture : {facSequence}
                      </div>
                      <div className="text-[10px] text-slate-600">Date : <span className="font-semibold">{formatSampleDate(sale.date)}</span></div>
                      {sale.paymentMethod && (
                        <div className="text-[10px] text-slate-500 capitalize">
                          Règlement : {sale.paymentMethod}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CLIENT & COMMERCIAL IDENTIFIERS ROW */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
                    {/* Client Box */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">
                        Destinataire / Client
                      </div>
                      <div className="font-bold text-xs text-slate-900">{sale.clientName}</div>
                      {sale.clientPhone && <div className="text-slate-600">Tél : {sale.clientPhone}</div>}
                      {sale.clientAddress && <div className="text-slate-600">{sale.clientAddress}</div>}
                      {sale.clientIce && <div className="text-slate-600 font-mono">ICE : {sale.clientIce}</div>}
                    </div>

                    {/* Company Legal Identifiers (Moroccan Legal compliance) */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col justify-center space-y-0.5 font-mono text-[9px] text-slate-700">
                      <div className="font-sans font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-0.5">
                        Identifiants Légaux Entreprise
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ICE :</span>
                        <span className="font-semibold">{settings.ice || '004027096000073'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">I.F. :</span>
                        <span className="font-semibold">{settings.ifCode || '45892147'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Patente :</span>
                        <span className="font-semibold">{settings.patente || '37920145'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CNSS :</span>
                        <span className="font-semibold">{settings.cnss || '7829410'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ville :</span>
                        <span className="font-semibold font-sans">{settings.city || 'Meknes'}</span>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCTS TABLE */}
                  <div className="border border-slate-300 rounded overflow-hidden mb-3">
                    <table className="w-full border-collapse text-left text-[10px]">
                      <thead>
                        <tr
                          className="border-b border-slate-300 font-bold uppercase text-[9px] text-slate-800"
                          style={{ backgroundColor: template?.tableHeaderBg || '#f1f5f9' }}
                        >
                          <th className="py-1.5 px-2 border-r border-slate-300">Désignation</th>
                          <th className="py-1.5 px-2 border-r border-slate-300 text-center">Quantité</th>
                          <th className="py-1.5 px-2 border-r border-slate-300 text-center">Caisse</th>
                          <th className="py-1.5 px-2 border-r border-slate-300 text-center">Carreaux</th>
                          <th className="py-1.5 px-2 border-r border-slate-300 text-right">Prix U (DH)</th>
                          <th className="py-1.5 px-2 text-right">Montant (DH)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sale.items && sale.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-2 border-r border-slate-200 font-medium">
                              <div>{it.designation}</div>
                              {it.reference && <span className="text-[9px] text-slate-500 font-mono">Réf: {it.reference}</span>}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono">
                              {formatQty(it.quantity)}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono">
                              {it.boxesCount || '-'}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono">
                              {it.looseTilesCount || it.totalTiles || '-'}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono">
                              {formatMoney(it.unitPrice)}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold">
                              {formatMoney(it.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TOTALS & TAX BREAKDOWN */}
                  <div className="flex justify-end mb-3">
                    <div className="w-[50%] border border-slate-300 p-2.5 rounded bg-slate-50 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Total HT :</span>
                        <span>{formatMoney(sale.totalHT || totalAmount)} {settings.currency || 'DH'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>TVA ({sale.tvaRate || settings.defaultTvaRate || 20}%) :</span>
                        <span>{formatMoney(sale.tvaAmount || 0)} {settings.currency || 'DH'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs border-t border-slate-300 pt-1 text-slate-900">
                        <span>Net à Payer (TTC) :</span>
                        <span style={{ color: template?.headerColor || '#0f172a' }}>
                          {formatMoney(totalAmount)} {settings.currency || 'DH'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SIGNATURES */}
                  <div className="grid grid-cols-2 gap-4 text-[9px] text-center pt-2 border-t border-slate-300 mb-2">
                    <div className="border border-dashed border-slate-300 rounded p-2 h-14 flex flex-col justify-between">
                      <span className="font-semibold text-slate-700">Visa & Bon pour accord Client</span>
                      <span className="text-[8px] text-slate-400">Signature</span>
                    </div>
                    <div className="border border-dashed border-slate-300 rounded p-2 h-14 flex flex-col justify-between">
                      <span className="font-semibold text-slate-700">Cachet & Signature La Direction</span>
                      <span className="text-[8px] text-slate-400">Pour {settings.businessName || 'CARRELAGE ARWA'}</span>
                    </div>
                  </div>
                </div>

                {/* LEGAL CLAUSE */}
                <div className="text-center text-[9.5px] italic text-slate-600 leading-tight border-t border-slate-100 pt-2 font-serif">
                  "{settings.receiptFooterLegalText || 'Les marchandises vendues ne seront ni reprises ni échangées et seront reconnues pour les clients avant leur acquisition.'}"
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
