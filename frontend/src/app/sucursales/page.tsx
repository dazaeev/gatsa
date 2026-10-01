'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Clock, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import api from '@/services/api';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  schedule: string;
}

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/publicsite/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error cargando sucursales', error);
      setBranches([
        {
          id: 'ORIZABA_BARRIO_NUEVO',
          name: 'Sucursal Barrio Nuevo - Orizaba',
          address: 'Av. Independencia #265 (entre Chapultepec y Mártires 7 de Enero), Barrio Nuevo, Orizaba, Veracruz',
          phone: '(272) 153-3528',
          whatsapp: '272 154 6920',
          schedule: 'Lunes a Viernes: 9:00 AM - 6:00 PM | Sábados: 9:00 AM - 2:00 PM'
        },
        {
          id: 'ORIZABA_CENTRO',
          name: 'Sucursal Centro Corporativo - Orizaba',
          address: 'Calle Real #410, Col. Centro, Orizaba, Veracruz',
          phone: '(272) 724-1000',
          whatsapp: '272 154 6920',
          schedule: 'Lunes a Viernes: 9:00 AM - 7:00 PM'
        }
      ]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-full">
          <MapPin className="w-4 h-4 text-sky-600" /> Red de Atención Presencial
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Nuestras Sucursales y Centros de Atención</h1>
        <p className="text-slate-600 text-sm">
          Visítanos para la recepción de tus documentos originales, firmas de solicitud de AFORE o asesorías personalizadas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {branches.map((b) => (
          <div key={b.id} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 rounded-xl w-fit text-sky-600">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{b.name}</h3>
              
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>

                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Tel: <strong>{b.phone}</strong></span>
                </p>

                <p className="flex items-center gap-2 text-emerald-600 font-bold">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>WhatsApp: <strong>{b.whatsapp}</strong></span>
                </p>

                <p className="flex items-start gap-2 text-slate-500">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>{b.schedule}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href={`https://wa.me/52${b.whatsapp.replace(/\s+/g, '')}?text=Hola%20GATSA,%20deseo%20visitar%20la%20${encodeURIComponent(b.name)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center transition flex items-center justify-center gap-2"
              >
                Agendar Cita en Sucursal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
