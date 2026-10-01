'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Phone, MapPin, Calculator, FileText, UserCheck, LogIn, LogOut, Menu, X, ShieldAlert, Award, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GatsaLogo } from './GatsaLogo';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Formato de nombre legible
  const getDisplayName = () => {
    if (!user || !user.fullName) return 'Usuario';
    const parts = user.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  const getRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'ROLE_ADMIN') return 'Administrador';
    if (user.role === 'ROLE_PARTNER') return 'Socio B2B';
    return 'Cliente';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      
      {/* Top Banner Contacto Sucursales */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Sucursal Barrio Nuevo Orizaba: Av. Independencia #265
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
              <Phone className="w-3.5 h-3.5" />
              WhatsApp Directo AFORE: 272 154 6920
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1">
              <Award className="w-3 h-3" /> Asesoría Gratuita CONSAR / IMSS
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Oficial GATSA */}
          <Link href="/" className="flex items-center gap-2 group">
            <GatsaLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/simulador-afore"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/simulador-afore') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4 text-sky-600" />
              Simulador AFORE
            </Link>
            <Link
              href="/cotizador-seguros"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/cotizador-seguros') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cotizador Seguros
            </Link>
            <Link
              href="/muro-noticias"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/muro-noticias') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Muro de Noticias
            </Link>
            <Link
              href="/sucursales"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/sucursales') ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Sucursales
            </Link>
          </nav>

          {/* Portal User Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                
                {/* Perfil del Usuario Activo */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  <User className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900 text-xs">{getDisplayName()}</span>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">{getRoleLabel()}</span>
                  </div>
                </div>

                {user?.role === 'ROLE_CLIENT' && (
                  <Link
                    href="/portal-cliente"
                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-sky-600" /> Mi Expediente
                  </Link>
                )}
                {user?.role === 'ROLE_PARTNER' && (
                  <Link
                    href="/portal-socio"
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Portal Socio
                  </Link>
                )}
                {user?.role === 'ROLE_ADMIN' && (
                  <Link
                    href="/admin-dashboard"
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <ShieldAlert className="w-4 h-4 text-sky-400" /> Panel Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4 text-rose-600" /> Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition hover:bg-slate-100 rounded-lg"
                >
                  Ingresar
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow-md shadow-sky-600/20 transition flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Acceso Clientes / Socios
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100"
          >
            Inicio
          </Link>
          <Link
            href="/simulador-afore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-sky-700 bg-sky-50"
          >
            Simulador AFORE
          </Link>
          <Link
            href="/cotizador-seguros"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cotizador Seguros
          </Link>
          <Link
            href="/muro-noticias"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100"
          >
            Muro Informativo
          </Link>
          <Link
            href="/sucursales"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100"
          >
            Sucursales
          </Link>
          <div className="pt-4 border-t border-slate-200 space-y-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="w-full text-left px-3 py-2 text-rose-600 font-bold"
              >
                Cerrar Sesión ({getDisplayName()})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow"
              >
                Acceso Clientes / Socios
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
