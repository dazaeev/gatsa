'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

function LoginContent() {
  const { isAuthenticated, user, login } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // REDIRECCIÓN AUTOMÁTICA SI YA TIENE SESIÓN ACTIVA
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ROLE_CLIENT') {
        router.replace('/portal-cliente');
      } else if (user.role === 'ROLE_PARTNER') {
        router.replace('/portal-socio');
      } else if (user.role === 'ROLE_ADMIN') {
        router.replace('/admin-dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { username: identifier.trim(), password });
      const { accessToken, role, fullName, email, phone } = response.data;
      
      login(accessToken, {
        fullName,
        email,
        phone,
        role,
      });

      // Enrutamiento Inteligente basado en el rol real de MySQL / JWT
      if (role === 'ROLE_CLIENT') {
        router.push('/portal-cliente');
      } else if (role === 'ROLE_PARTNER') {
        router.push('/portal-socio');
      } else if (role === 'ROLE_ADMIN') {
        router.push('/admin-dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Error en autenticación', err);
      setError('Credenciales inválidas. Verifica tu correo o número de teléfono y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-6">
        
        {/* Cabecera Unificada */}
        <div className="text-center space-y-2">
          <div className="p-3 bg-sky-600 rounded-xl text-white w-fit mx-auto font-black shadow-lg shadow-sky-600/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso al Ecosistema GATSA</h1>
          <p className="text-xs text-slate-500">Ingresa con tu correo electrónico o número celular registrado</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Correo Electrónico o Teléfono Celular *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoComplete="off"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. usuario@correo.com o 2721104860"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 font-medium"
              />
            </div>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>¿Solicitaste orientación o cotización en la web?</strong> Tu contraseña inicial de acceso son los <strong>10 dígitos de tu número celular</strong> registrado.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-slate-500">Cargando módulo de autenticación...</div>}>
      <LoginContent />
    </Suspense>
  );
}
