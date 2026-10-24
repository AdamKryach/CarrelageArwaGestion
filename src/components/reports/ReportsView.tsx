import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StoreSettings } from '../../types';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  Building2,
  Users2,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportsViewProps {
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ settings }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports({ startDate, endDate });
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const exportCSV = () => {
    if (!reportData) return;
    const rows = [
      ['Rapport Financier CarrelageArwa'],
      ['Période', `${startDate} au ${endDate}`],
      [''],
      ['Indicateur', 'Montant (DH)'],
      ['Ventes Total HT', reportData.salesSummary.totalHT],
      ['Ventes Total TTC', reportData.salesSummary.totalTTC],
      ['Coût d’achat des marchandises vendues (CAMV)', reportData.salesSummary.costOfGoodsSold],
      ['Marge Brute Réalisée', reportData.salesSummary.grossMargin],
      ['Taux de Marge (%)', `${reportData.salesSummary.marginPercentage}%`],
      ['Total Achats Fournisseurs Période', reportData.purchasesSummary.totalAmount],
      ['Total Règlements Fournisseurs Versés', reportData.purchasesSummary.totalPaid],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_Financier_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Rapports Financiers & Rentabilité</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Marge commerciale réelle basée sur les coûts d'achat historiques, achats et dettes.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!reportData}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Rapport CSV</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-slate-700">Période d'analyse :</span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-slate-500">Du</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
          />
          <label className="text-slate-500">Au</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
          />
          <button
            onClick={fetchReports}
            className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      {reportData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires HT</span>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {reportData.salesSummary.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {settings.currency}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                {reportData.salesSummary.count} vente(s) enregistrée(s)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coût des Marchandises (Achat)</span>
              <div className="mt-2 text-2xl font-black text-slate-700">
                {reportData.salesSummary.costOfGoodsSold.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {settings.currency}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Prix d'achat réel au moment de la vente
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marge Brute Réalisée</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                {reportData.salesSummary.grossMargin.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {settings.currency}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                Taux de marge : {reportData.salesSummary.marginPercentage}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Achats Fournisseurs</span>
              <div className="mt-2 text-2xl font-black text-amber-800">
                {reportData.purchasesSummary.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {settings.currency}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Payé : {reportData.purchasesSummary.totalPaid.toFixed(2)} {settings.currency}
              </div>
            </div>
          </div>

          {/* Supplier Liabilities Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Dettes Restantes envers les Fournisseurs</span>
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {reportData.supplierLiabilities.map((sup: any, i: number) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      <div className="text-[10px] text-slate-500">Tél: {sup.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${sup.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {sup.balanceDue.toFixed(2)} {settings.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">Total achats: {sup.totalPurchases.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Credit Receivables */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Users2 className="w-4 h-4 text-indigo-600" />
                  <span>Créances & Crédits Clients en Cours</span>
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {reportData.clientCredits.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">Aucun crédit client en cours.</div>
                ) : (
                  reportData.clientCredits.map((cli: any, i: number) => (
                    <div key={i} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{cli.name}</div>
                        <div className="text-[10px] text-slate-500">Tél: {cli.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-indigo-700">
                          {cli.balanceDue.toFixed(2)} {settings.currency}
                        </div>
                        <div className="text-[10px] text-slate-400">Total ventes: {cli.totalSales.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
