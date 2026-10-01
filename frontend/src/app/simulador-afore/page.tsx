'use client';

import React, { useState } from 'react';
import { Calculator, Info, CheckCircle2, AlertCircle, ShieldCheck, PhoneCall } from 'lucide-react';
import api from '@/services/api';

interface SimulationResult {
  salary: number;
  weeks: number;
  estimatedRetirementAmount: number;
  eligibleForUnemployment: boolean;
}

export default function SimuladorAforePage() {
  const [salary, setSalary] = useState<number>(12000);
  const [weeks, setWeeks] = useState<number>(250);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const calculateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const response = await api.get('/publicsite/simulator/afore', {
        params: { salary, weeks }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error calculando simulación', error);
      alert('Error en el servidor de cálculo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold rounded-full">
          <Calculator className="w-4 h-4 text-sky-700" /> Criterios Normativos CONSAR / Ley IMSS 1973 y 1997
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Calculadora Estimada de Retiro por Desempleo
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Ingresa tu salario mensual base registrado y las semanas cotizadas ante el IMSS para conocer el importe aproximado al que tienes derecho por retiro parcial de tu AFORE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Inputs */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-sky-600" />
            Parámetros de Cotización
          </h2>

          <form onSubmit={calculateEstimate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Salario Mensual Base Registrado ($ MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="2500"
                  max="150000"
                  required
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-600 focus:bg-white transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Salario diario registrado ante el IMSS multiplicado por 30 días.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Semanas Cotizadas ante el IMSS *
              </label>
              <input
                type="number"
                min="10"
                max="2500"
                required
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-600 focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">Mínimo 150 semanas cotizadas requeridas por CONSAR.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-lg text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Calculando...' : 'Calcular Retiro Estimado'}
            </button>
          </form>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-600" /> Requisitos de Ley CONSAR:
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>Tener al menos 46 días naturales en situación de desempleo.</li>
              <li>Tener Expediente de Identificación actualizado en tu AFORE.</li>
              <li>No haber ejercido este retiro en los últimos 5 años.</li>
            </ul>
          </div>
        </div>

        {/* Output Results */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="p-8 bg-white rounded-2xl border border-sky-200 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">Resultado de Simulación</span>
                  <h3 className="text-2xl font-bold text-slate-900">Monto Estimado de Retiro</h3>
                </div>
                {result.eligibleForUnemployment ? (
                  <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Elegible para Trámite
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Requiere Revisión
                  </span>
                )}
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-xl text-center space-y-2 shadow-inner">
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Importe Aproximado a Recibir</span>
                <div className="text-4xl sm:text-5xl font-black text-sky-400">
                  ${result.estimatedRetirementAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-slate-300">MXN</span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Monto sujeto a la antigüedad de tu cuenta individual y salario base ante el IMSS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Modalidad A (Cuenta AFORE &gt; 3 años)</span>
                  <p className="text-slate-600">Hasta 30 días de tu último salario base cotizado (tope 10 UMAs).</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Modalidad B (Cuenta AFORE &gt; 5 años)</span>
                  <p className="text-slate-600">El menor entre 90 días de salario o 11.5% del saldo de la subcuenta.</p>
                </div>
              </div>

              <div className="p-5 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-sky-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">¿Deseas tramitar tu retiro de AFORE sin filas?</h4>
                    <p className="text-xs text-slate-600">
                      Un asesor de GATSA en la Sucursal Barrio Nuevo Orizaba te guiará paso a paso para integrar tu expediente.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/522721546920?text=Hola%20GATSA,%20realic%C3%A9%20una%20simulaci%C3%B3n%20en%20su%20portal%20por%20$${result.estimatedRetirementAmount}%20MXN%20y%20deseo%20asesor%C3%ADa.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-center text-xs shadow transition flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" /> Iniciar Trámite por WhatsApp (272 154 6920)
                  </a>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
              <div className="p-4 bg-sky-50 rounded-full w-fit mx-auto text-sky-600 border border-sky-100">
                <Calculator className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Ingresa los datos para ver tu estimación</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Los cálculos se apegan a los lineamientos vigentes de la CONSAR y del Instituto Mexicano del Seguro Social.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
