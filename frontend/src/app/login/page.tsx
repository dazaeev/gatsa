'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

  // LIMPIAR QUERY PARAMS COMO ? DE LA URL Y REDIRECCIONAR SI YA TIENE SESIÓN
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      let targetPath = '/portal-cliente';
      if (user.role === 'ROLE_PARTNER') {
        targetPath = '/portal-socio';
      } else if (
        user.role === 'ROLE_ADMIN' ||
        user.role === 'ROLE_SUPER_ADMIN' ||
        user.role === 'ROLE_GERENTE_SUCURSAL' ||
        user.role === 'ROLE_AGENTE_COMPLETO' ||
        user.role === 'ROLE_OPERADOR_IMSS'
      ) {
        targetPath = '/admin-dashboard';
      }
      router.push(targetPath);
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!identifier.trim() || !password) {
      const emptyMsg = 'Por favor ingresa tu correo/teléfono y tu contraseña.';
      setError(emptyMsg);
      toast.error('Campos incompletos', { description: emptyMsg });
      return;
    }

    setLoading(true);
    setError(null);

    const cleanIdentifier = identifier.trim();

    try {
      const response = await api.post('/auth/login', { username: cleanIdentifier, password });
      const { accessToken, role, fullName, email, phone, branch } = response.data;
      
      toast.success('¡Autenticación exitosa!', {
        description: `Bienvenido al ecosistema GATSA, ${fullName || 'Usuario'}.`,
      });

      login(accessToken, {
        fullName,
        email,
        phone,
        role,
        branch,
      });

      // Enrutamiento Garantizado basado en el rol real
      let targetPath = '/portal-cliente';
      if (role === 'ROLE_PARTNER') {
        targetPath = '/portal-socio';
      } else if (
        role === 'ROLE_ADMIN' ||
        role === 'ROLE_SUPER_ADMIN' ||
        role === 'ROLE_GERENTE_SUCURSAL' ||
        role === 'ROLE_AGENTE_COMPLETO' ||
        role === 'ROLE_OPERADOR_IMSS'
      ) {
        targetPath = '/admin-dashboard';
      }

      router.push(targetPath);
    } catch (err: any) {
      console.error('Error en autenticación', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      const networkMsg = err.message === 'Network Error' ? 'Sin respuesta del servidor backend (Spring Boot). Verifica tu conexión o IP.' : null;
      const finalMsg = serverMsg || networkMsg || 'Credenciales inválidas. Verifica tu correo/teléfono y contraseña.';
      
      setError(finalMsg);
      toast.error('Error de inicio de sesión', {
        description: finalMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-6">
        
        {/* Cabecera Unificada */}
        <div className="text-center space-y-2">
          <div className="p-3 bg-sky-600 rounded-xl text-white w-fit mx-auto font-black shadow-lg shadow-sky-600/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Acceso al Ecosistema GATSA</h1>
          <p className="text-xs text-slate-500">Ingresa con tu correo electrónico o número celular registrado</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center font-bold leading-relaxed animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          suppressHydrationWarning
          autoComplete="off"
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Correo Electrónico o Teléfono Celular *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                suppressHydrationWarning
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ej. usuario@correo.com o 2721104860"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-sky-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                suppressHydrationWarning
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-sky-600 font-medium"
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
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando...
              </>
            ) : (
              <>
                Iniciar Sesión <ArrowRight className="w-4 h-4" />
              </>
            )}
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
