import React from 'react';
import Link from 'next/link';
import { Shield, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-600 rounded-lg text-white font-black">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                GATSA <span className="text-sky-400 text-xs font-normal">SERVICIOS</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Firma mexicana especializada en soluciones patrimoniales, trámites de AFORE (Retiro por Desempleo, Matrimonio, Consolidación), Créditos Mejoravit, Seguros Patrimoniales y Red B2B de Aliados Comerciales.
            </p>
            <div className="pt-2 text-xs text-sky-400 font-semibold flex items-center gap-1">
              <span>● Respaldados por normatividad CONSAR / IMSS</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold text-base tracking-wide border-b border-slate-800 pb-2">
              Servicios Destacados
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/simulador-afore" className="hover:text-sky-400 transition flex items-center gap-1.5">
                  › Retiro por Desempleo AFORE (Modalidades A y B)
                </Link>
              </li>
              <li>
                <Link href="/cotizador-seguros" className="hover:text-sky-400 transition flex items-center gap-1.5">
                  › Seguros de Vida, Autos y Gastos Médicos
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-sky-400 transition flex items-center gap-1.5">
                  › Asesoría y Créditos Mejoravit
                </Link>
              </li>
              <li>
                <Link href="/portal-socio" className="hover:text-sky-400 transition flex items-center gap-1.5">
                  › Red de Proveeduría y Monedero B2B
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold text-base tracking-wide border-b border-slate-800 pb-2">
              Sucursal Barrio Nuevo (Orizaba)
            </h3>
            <div className="space-y-2 text-xs leading-relaxed">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Av. Independencia #265 (entre Chapultepec y Mártires 7 de Enero), Barrio Nuevo, Orizaba, Ver.</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Tel: (272) 153-3528</span>
              </p>
              <p className="flex items-center gap-2 text-sky-300 font-medium">
                <Phone className="w-4 h-4 shrink-0" />
                <span>WhatsApp Directo: 272 154 6920</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Lun-Vie 9:00am - 6:00pm</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold text-base tracking-wide border-b border-slate-800 pb-2">
              Portales y Acceso Privado
            </h3>
            <p className="text-xs text-slate-400">
              Consulta en tiempo real el estatus de tu expediente o administra tu saldo si eres socio comercial.
            </p>
            <div className="pt-2 space-y-2">
              <Link
                href="/login"
                className="block w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                Acceder a Portal Clientes <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/login"
                className="block w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded text-xs font-semibold text-center transition flex items-center justify-center gap-1"
              >
                Acceder a Portal Socios B2B <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Grupo GATSA Servicios Financieros S.A. de C.V. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Aviso de Privacidad</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Términos y Condiciones</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Unidad Especializada CONDUSEF</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
