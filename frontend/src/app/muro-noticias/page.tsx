'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, Calendar, MessageSquare } from 'lucide-react';
import api from '@/services/api';

interface Post {
  id: number;
  title: string;
  category: string;
  content: string;
  imageUrl?: string;
  imageBase64?: string;
  createdAt: string;
}

export default function MuroNoticiasPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/publicsite/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error cargando muro de noticias', error);
    } finally {
      setLoading(false);
    }
  };

  const displayPosts = posts.length > 0 ? posts : [
    {
      id: 1,
      title: 'Aviso Oficial CONSAR: Nuevos topes para retiro parcial por desempleo 2026',
      category: 'NOTICIAS_AFORE',
      content: 'Les informamos a todos nuestros clientes que la Comisión Nacional del Sistema de Ahorro para el Retiro ha actualizado la UMA de referencia para el cálculo de Modalidad A y B. Acércate a la sucursal Barrio Nuevo Orizaba para actualizar tu expediente.',
      createdAt: '2026-09-28T10:00:00'
    },
    {
      id: 2,
      title: 'Apertura de la nueva ventanilla de atención rápida en Orizaba',
      category: 'GATSA_ANUNCIOS',
      content: 'Inauguramos nuestro módulo dedicado exclusivamente a solicitudes de Crédito Mejoravit y trámites de AFORE. Te esperamos en Av. Independencia #265 con atención de Lunes a Sábado.',
      createdAt: '2026-09-20T14:30:00'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-full">
          <Newspaper className="w-4 h-4 text-sky-600" /> Muro de Anuncios y Educación Financiera
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Novedades Corporativas GATSA</h1>
        <p className="text-slate-600 text-sm">
          Avisos de la CONSAR, publicaciones sobre previsión social, créditos y actualizaciones de nuestras sucursales.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando publicaciones del muro...</div>
      ) : (
        <div className="space-y-6">
          {displayPosts.map((post) => (
            <article key={post.id} className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4 hover:border-slate-300 transition">
              
              <div className="flex items-center justify-between gap-4">
                <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold uppercase tracking-wide">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(post.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h2>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-80">
                  <img src={post.imageUrl} alt={post.title} className="w-full object-cover" />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Publicado por Dirección Corporativa GATSA</span>
                <a
                  href={`https://wa.me/522721546920?text=Hola%20GATSA,%20vi%20en%20su%20muro%20la%20publicaci%C3%B3n:%20${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline font-bold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Consultar por WhatsApp
                </a>
              </div>

            </article>
          ))}
        </div>
      )}

    </div>
  );
}
