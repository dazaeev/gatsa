'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, Shield, Building2, CheckCircle2, ArrowRight, Phone, MessageSquare, Award, Clock, FileCheck, ArrowUpRight, Users, Target, ThumbsUp, HeartHandshake, AlertCircle, LogIn, UserCheck } from 'lucide-react';
import api from '../services/api';
import { GatsaLogo } from '../components/GatsaLogo';

export default function HomePage() {
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [quickLead, setQuickLead] = useState({
    fullName: '',
    phone: '',
    email: '',
    branch: 'ORIZABA_BARRIO_NUEVO',
    serviceOfInterest: 'RETIRO_DESEMPLEO_AFORE',
    notes: 'Solicitud rápida desde Landing Page'
  });

  React.useEffect(() => {
    api.get('/publicsite/branches').then(resp => {
      if (Array.isArray(resp.data) && resp.data.length > 0) {
        setBranchesList(resp.data);
        if (resp.data[0].id) {
          setQuickLead(prev => ({ ...prev, branch: resp.data[0].id }));
        }
      }
    }).catch(err => console.error('Error cargando sucursales publicas', err));
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);

    // Validación previa de 10 dígitos en frontend
    if (!/^\d{10}$/.test(quickLead.phone.trim())) {
      setErrorMessage('El teléfono debe contener exactamente 10 dígitos numéricos (ej. 2721234567).');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/publicsite/leads', quickLead);
      if (response.data && response.data.isExistingUser) {
        setIsExistingUser(true);
      } else {
        setIsExistingUser(false);
      }
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error enviando lead', error);
      if (error.response && error.response.data) {
        const backendMsg = error.response.data.message || error.response.data.errors;
        setErrorMessage(typeof backendMsg === 'string' ? backendMsg : 'Revisa que el teléfono sea de 10 dígitos.');
      } else {
        setErrorMessage('Ocurrió un error al registrar tu contacto. Inténtalo nuevamente o contáctanos por WhatsApp.');
      }
    } finally {
      setLoading(false);
    }
  };

  const afores = [
    { name: 'Profuturo', logo: 'Profuturo AFORE' },
    { name: 'PensionISSSTE', logo: 'AFORE PensionISSSTE' },
    { name: 'Coppel', logo: 'Afore Coppel' },
    { name: 'Azteca', logo: 'Afore Azteca' },
    { name: 'Citibanamex', logo: 'citibanamex AFORE' },
    { name: 'Principal', logo: 'Principal AFORE' },
    { name: 'SURA', logo: 'sura AFORE' },
    { name: 'Inbursa', logo: 'INBURSA Afore' },
    { name: 'XXI Banorte', logo: 'afore XXI BANORTE' },
    { name: 'InverCap', logo: 'InverCap Afore' },
  ];

  const pillars = [
    {
      icon: Users,
      title: 'EXPERIENCIA Y CONFIANZA',
      desc: 'Años de trayectoria brindando respaldo a trabajadores y ahorradores en el estado de Veracruz.'
    },
    {
      icon: HeartHandshake,
      title: 'ASESORÍA PERSONALIZADA',
      desc: 'Atención individualizada para elegir la mejor estrategia de retiro o póliza de protección.'
    },
    {
      icon: Target,
      title: 'SOLUCIONES A TU MEDIDA',
      desc: 'Trámites de AFORE, créditos Mejoravit y cotizaciones multirramo adaptadas a tus necesidades.'
    },
    {
      icon: ThumbsUp,
      title: 'COMPROMISO CON TU FUTURO',
      desc: 'Garantía de acompañamiento en cada fase de tu expediente de retiro o reclamo de seguro.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION - Executive Clean Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Main Pitch */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wide">
                <Award className="w-4 h-4 text-sky-400" /> Firma Especializada en Asesoría Patrimonial & Previsión Social
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Respaldo Financiero para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-200">Futuro y Patrimonio</span>
              </h1>
              
              <p className="text-lg text-slate-300 leading-relaxed font-normal">
                Especialistas en trámites de <strong>AFORE</strong>, retiros parciales por desempleo, créditos <strong>Mejoravit</strong>, cotizaciones de <strong>Seguros</strong> y soluciones de proveeduría B2B.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/simulador-afore"
                  className="px-6 py-4 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-600/30 text-center transition flex items-center justify-center gap-2 group"
                >
                  <Calculator className="w-5 h-5" />
                  Simulador de Desempleo AFORE
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/cotizador-seguros"
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700 rounded-xl text-center transition flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5 text-sky-400" />
                  Solicitar Asesoría Directa
                </Link>
              </div>

              {/* Banner Sucursal Orizaba */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">SUCURSAL BARRIO NUEVO ORIZABA</span>
                    <span>Av. Independencia #265 • Tel: (272) 153-3528</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Atención e Integración Gratuita</span>
                    <span>Dictamen conforme a Ley IMSS / CONSAR</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Form Lead Captura */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl text-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-sky-600" />
                    Solicitar Orientación Especializada
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Déjanos tus datos y un asesor se comunicará contigo desde la sucursal de tu elección.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {submitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">¡Solicitud Registrada Exitosamente!</h3>
                      {isExistingUser ? (
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Detectamos que tu teléfono o correo ya cuenta con un expediente registrado en Grupo GATSA. Un asesor se comunicará contigo a la brevedad. Tu contraseña original permanece intacta.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Hemos activado tu cuenta de portal. Un asesor se comunicará contigo a la brevedad. Tu contraseña inicial son tus 10 dígitos de teléfono registrado.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 space-y-2">
                      <Link
                        href="/login"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" /> Ingresar a Mi Expediente
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-slate-500 underline font-semibold hover:text-slate-800"
                      >
                        Enviar otra consulta
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleQuickLeadSubmit} suppressHydrationWarning className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        suppressHydrationWarning
                        placeholder="Ej. Nazario Dazaeev"
                        value={quickLead.fullName}
                        onChange={(e) => setQuickLead({ ...quickLead, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp (10 dígitos) *</label>
                      <input
                        type="tel"
                        required
                        suppressHydrationWarning
                        minLength={10}
                        maxLength={10}
                        pattern="\d{10}"
                        placeholder="Ej. 2721104860"
                        value={quickLead.phone}
                        onChange={(e) => setQuickLead({ ...quickLead, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        suppressHydrationWarning
                        placeholder="ejemplo@correo.com"
                        value={quickLead.email}
                        onChange={(e) => setQuickLead({ ...quickLead, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Trámite o Servicio</label>
                      <select
                        value={quickLead.serviceOfInterest}
                        suppressHydrationWarning
                        onChange={(e) => setQuickLead({ ...quickLead, serviceOfInterest: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white transition"
                      >
                        <option value="RETIRO_DESEMPLEO_AFORE">Retiro por Desempleo AFORE</option>
                        <option value="MEJORAVIT">Asesoría Crédito Mejoravit</option>
                        <option value="COTIZADOR_SEGUROS">Cotización de Seguros</option>
                        <option value="PROVEEDURIA_B2B">Red de Socios / Negocios B2B</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal Preferida</label>
                      <select
                        value={quickLead.branch}
                        suppressHydrationWarning
                        onChange={(e) => setQuickLead({ ...quickLead, branch: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white transition"
                      >
                        {branchesList.length > 0 ? (
                          branchesList.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="ORIZABA_BARRIO_NUEVO">Barrio Nuevo - Orizaba (Av. Independencia #265)</option>
                            <option value="ORIZABA_CENTRO">Centro Corporativo - Orizaba</option>
                            <option value="HUATUSCO_CENTRO">Sucursal Huatusco</option>
                          </>
                        )}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
                    >
                      {loading ? 'Enviando...' : 'Contactar Asesor de GATSA'}
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center border-t border-slate-100">
                  <a
                    href="https://wa.me/522721546920"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp AFORE Directo: 272 154 6920
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN DIAGRAMA AFORES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-12 text-center">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <GatsaLogo size="lg" className="mx-auto" />
            <p className="text-xl font-extrabold text-slate-900">
              Trabajamos con todas las Afores para brindarte la <span className="text-sky-600">mejor asesoría</span>.
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              Orientación imparcial, transparente e independiente conforme a regulaciones CONSAR
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {afores.map((afore, index) => (
              <div
                key={index}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2 hover:border-sky-500 hover:bg-sky-50/50 hover:shadow-md transition group"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 font-bold text-xs group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 text-sky-600" />
                </div>
                <span className="font-bold text-slate-800 text-sm">{afore.logo}</span>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="space-y-3 text-center px-2">
                  <div className="p-3.5 bg-sky-50 text-sky-700 rounded-2xl w-fit mx-auto border border-sky-100 shadow-sm">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm tracking-wider uppercase">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECCIÓN PILARES DE SERVICIO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Nuestros Servicios Financieros</span>
          <h2 className="text-3xl font-extrabold text-slate-900">Soluciones Integrales de Previsión y Patrimonio</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg space-y-4 hover:border-sky-400 transition group">
            <div className="p-3 bg-sky-50 rounded-xl w-fit text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Calculator className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Trámites AFORE & Desempleo</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cálculo y gestión del importe a retirar de tu cuenta individual ante el IMSS según salario base y semanas cotizadas.
            </p>
            <Link
              href="/simulador-afore"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-700"
            >
              Ir al Simulador AFORE <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg space-y-4 hover:border-sky-400 transition group">
            <div className="p-3 bg-indigo-50 rounded-xl w-fit text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Seguros Patrimoniales</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Protección para tu familia, vehículo y salud con coberturas flexibles y las mejores aseguradoras del mercado.
            </p>
            <Link
              href="/cotizador-seguros"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-700"
            >
              Cotizar Seguro <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg space-y-4 hover:border-sky-400 transition group">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Red B2B de Aliados</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Plataforma para papelerías y comercios afiliados con monedero virtual prepago y emisión de folios oficiales.
            </p>
            <Link
              href="/portal-socio"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-700"
            >
              Portal Socios B2B <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
