'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, PlusCircle, Award } from 'lucide-react';
import api from '@/services/api';

interface WalletData {
  partnerName: string;
  availableBalance: number;
  creditLimit: number;
  issuedFoliosCount: number;
  recentTransactions: {
    id: string;
    concept: string;
    amount: number;
    date: string;
  }[];
}

export default function PortalSocioPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await api.get('/b2bpartner/wallet');
      setWallet(response.data);
    } catch (error) {
      console.error('Error cargando wallet de socio', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold rounded-full mb-2">
            <Award className="w-4 h-4 text-emerald-400" /> Aliado Comercial Acreditado B2B
          </div>
          <h1 className="text-2xl font-black text-white">{wallet?.partnerName || 'Papelería y Novedades Orizaba'}</h1>
          <p className="text-xs text-slate-400 mt-1">Plataforma de Proveeduría de Trámites y Folios Digitales GATSA</p>
        </div>

        <button type="button" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Recargar Monedero Prepago
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Saldo Disponible</span>
          <div className="text-3xl font-black text-emerald-600">
            ${wallet?.availableBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '4,850.00'} <span className="text-xs text-slate-500">MXN</span>
          </div>
          <p className="text-[11px] text-slate-400">Listo para la emisión inmediata de folios de trámite.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Límite de Crédito Autorizado</span>
          <div className="text-3xl font-black text-sky-600">
            ${wallet?.creditLimit.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '10,000.00'} <span className="text-xs text-slate-500">MXN</span>
          </div>
          <p className="text-[11px] text-slate-400">Línea revolvente asignada por Corporativo GATSA.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Folios Emitidos</span>
          <div className="text-3xl font-black text-slate-900">
            {wallet?.issuedFoliosCount || 142} <span className="text-xs text-slate-500">Trámites</span>
          </div>
          <p className="text-[11px] text-slate-400">Acumulado del mes en curso.</p>
        </div>

      </div>

      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Últimos Movimientos del Monedero</span>
          <span className="text-xs text-slate-500 font-normal">Actualizado en tiempo real</span>
        </h2>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando transacciones...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {wallet?.recentTransactions.map((tx) => (
              <div key={tx.id} className="py-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{tx.concept}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{tx.id} • {tx.date}</span>
                  </div>
                </div>

                <div className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)} MXN
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
