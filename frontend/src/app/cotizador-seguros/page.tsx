'use client';

import React, { useState } from 'react';
import { Shield, Heart, Car, UserCheck, Home, CheckCircle2, Mail } from 'lucide-react';
import api from '@/services/api';

export default function CotizadorSegurosPage() {
  const [insuranceType, setInsuranceType] = useState<string>('VIDA');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [age, setAge] = useState<number>(35);
  
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const response = await api.post('/publicsite/insurance/quote', {
        insuranceType,
        fullName,
        email,
        phone,
        age
      });
      setQuoteResult(response.data);
    } catch (error) {
      console.error('Error calculando prima de seguro', error);
      alert('Error al generar la cotización. Revisa los datos ingresados.');
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: 'VIDA', label: 'Seguro de Vida', icon: Heart, desc: 'Respaldo para la tranquilidad financiera de tu familia.' },
    { id: 'AUTOS', label: 'Seguro de Autos', icon: Car, desc: 'Cobertura amplia, daños a terceros y asistencia vial 24/7.' },
    { id: 'GASTOS_MEDICOS', label: 'Gastos Médicos Mayores', icon: UserCheck, desc: 'Atención médica en hospitales privados con deducible flexible.' },
    { id: 'PATRIMONIAL', label: 'Seguro Patrimonial / Hogar', icon: Home, desc: 'Protección contra incendios, robos y desastres naturales.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-full">
          <Shield className="w-4 h-4 text-sky-600" /> Coberturas Multirramo Personalizadas
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Cotizador Inteligente de Seguros GATSA</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Selecciona el ramo de protección, ingresa tus datos básicos y obtén una estimación de prima en tiempo real con seguimiento directo de un agente especializado.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map((type) => {
          const Icon = type.icon;
          const selected = insuranceType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setInsuranceType(type.id);
                setQuoteResult(null);
              }}
              className={`p-6 rounded-2xl border text-left transition space-y-3 ${
                selected
                  ? 'bg-sky-50 border-sky-500 text-slate-900 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-3 rounded-xl w-fit ${selected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{type.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-6 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Datos para la Cotización</span>
            <span className="text-xs text-sky-600 font-bold uppercase">{insuranceType}</span>
          </h2>

          <form onSubmit={handleQuote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Roberto Carlos Gómez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 2721234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Edad del Titular *</label>
              <input
                type="number"
                min="18"
                max="85"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Procesando...' : 'Obtener Cotización Estimada'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {quoteResult ? (
            <div className="p-8 bg-white rounded-2xl border border-sky-200 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Cotización Generada</h3>
                  <p className="text-xs text-slate-500">Ramo: {quoteResult.insuranceType}</p>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-xl text-center space-y-2 shadow-inner">
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Prima Anual Estimada desde</span>
                <div className="text-4xl font-black text-sky-400">
                  ${quoteResult.estimatedAnnualPremium.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-sm text-slate-300">{quoteResult.currency}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {quoteResult.message}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Se ha enviado un desglose preliminar al correo <strong>{email}</strong>.</span>
                </p>
              </div>

              <a
                href={`https://wa.me/522721546920?text=Hola%20GATSA,%20cotic%C3%A9%20un%20Seguro%20de%20${insuranceType}%20para%20${fullName}%20y%20deseo%20m%C3%A1s%20detalles.`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-center text-xs shadow transition"
              >
                Atención Personalizada por WhatsApp
              </a>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
              <Shield className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Completa los campos para consultar</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Recibirás una evaluación instantánea y la opción de personalizar coberturas especiales o deducibles con nuestros asesores.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
