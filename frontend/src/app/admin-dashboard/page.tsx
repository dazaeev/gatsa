'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, Phone, Search, FileText, Settings, Save, CheckCircle2, Lock, LogIn, ArrowRight, Eye, Download, X, FileCheck2, Clock, Layers, Filter, Building2, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  branch: string;
  serviceOfInterest: string;
  notes: string;
  status: string;
  createdAt: string;
}

interface DocMapItem {
  id: number;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
}

interface ProcedureAdminItem {
  leadId: number;
  procedureId: string;
  serviceOfInterest: string;
  branch: string;
  status: string;
  documents: DocMapItem[];
}

interface ClientDocumentGroup {
  userId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  procedures: ProcedureAdminItem[];
}

export default function AdminDashboardPage() {
  const { isAuthenticated, user, logout } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clientGroups, setClientGroups] = useState<ClientDocumentGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'leads' | 'documents' | 'config'>('leads');

  const [adminEmail, setAdminEmail] = useState<string>('ing.dazaeev@gmail.com');
  const [configSuccess, setConfigSuccess] = useState<boolean>(false);

  // Viewer Modal State
  const [selectedDocInfo, setSelectedDocInfo] = useState<{ id: number; fileName: string; docType: string; clientName: string } | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ROLE_ADMIN') {
      fetchAdminData();
    } else {
      setLoading(false);
      setAccessDenied(true);
    }
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const [leadsResp, docsResp, configResp] = await Promise.all([
        api.get('/admin/leads'),
        api.get('/admin/documents'),
        api.get('/admin/config')
      ]);
      setLeads(leadsResp.data);
      setClientGroups(docsResp.data);
      if (configResp.data && configResp.data.adminEmail) {
        setAdminEmail(configResp.data.adminEmail);
      }
    } catch (error: any) {
      console.warn('Sesión caducada o token inválido en panel de administración');
      setAccessDenied(true);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDocument = async (docId: number, fileName: string, docType: string, clientName: string) => {
    setSelectedDocInfo({ id: docId, fileName, docType, clientName });
    setViewModalOpen(true);
    setLoadingDoc(true);
    setDocBlobUrl(null);

    try {
      const response = await api.get(`/portalclient/download-document/${docId}`, {
        responseType: 'blob'
      });
      const mimeType = (response.headers && response.headers['content-type']) ? String(response.headers['content-type']) : 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);
    } catch (err) {
      console.error('Error cargando recurso del documento', err);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDownloadFile = () => {
    if (docBlobUrl && selectedDocInfo) {
      const link = document.createElement('a');
      link.href = docBlobUrl;
      link.download = selectedDocInfo.fileName || 'Documento_GATSA.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/config', { adminEmail });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error('Error guardando configuración', err);
      alert('Error guardando la configuración de notificaciones en BD.');
    }
  };

  // Filtros universales para Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch = l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.phone.includes(searchTerm) ||
                          l.serviceOfInterest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || l.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  // Filtros universales para Expedientes/Documentos Agrupados por Cliente
  const filteredClientGroups = clientGroups.filter((group) => {
    const term = searchTerm.toLowerCase();
    const matchesClient = group.clientName.toLowerCase().includes(term) ||
                          group.clientPhone.includes(term) ||
                          group.clientEmail.toLowerCase().includes(term);
    
    const matchesProcedure = group.procedures.some(p => 
      p.procedureId.toLowerCase().includes(term) ||
      p.serviceOfInterest.toLowerCase().includes(term)
    );

    const matchesBranch = branchFilter === 'ALL' || group.procedures.some(p => p.branch === branchFilter);

    return (matchesClient || matchesProcedure) && matchesBranch;
  });

  // SI NO ESTÁ AUTENTICADO COMO ADMINISTRADOR
  if (!isAuthenticated || user?.role !== 'ROLE_ADMIN' || accessDenied) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-full w-fit mx-auto shadow">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso Restringido - Área Administrador</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se requieren credenciales activas con rol de <strong>Administrador Corporativo GATSA</strong>.
          </p>
          <div className="pt-2 space-y-3">
            <Link
              href="/login?type=admin"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-sky-400" /> Iniciar Sesión como Administrador <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="block text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Volver a la Página Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Admin Header */}
      <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold rounded-full mb-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" /> Panel de Control Administrador GATSA
          </div>
          <h1 className="text-2xl font-black text-white">Gestión Centralizada de Solicitudes y Documentos</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisión en tiempo real de expedientes, INE cargados y notificaciones en BD.</p>
        </div>

        <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-center">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Solicitudes</span>
          <span className="text-xl font-bold text-sky-400">{leads.length} Registros</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS POR SUCURSAL */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Buscador Universal */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, folio (ej. GATSA-2026-1019) o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
          />
        </div>

        {/* Filtro por Sucursal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600"
          >
            <option value="ALL">Todas las Sucursales</option>
            <option value="ORIZABA_BARRIO_NUEVO">Sucursal Barrio Nuevo - Orizaba</option>
            <option value="ORIZABA_CENTRO">Centro Corporativo - Orizaba</option>
            <option value="HUATUSCO_CENTRO">Sucursal Huatusco</option>
          </select>
        </div>

      </div>

      {/* Selector de Pestañas del Admin */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'leads' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> Solicitudes y Prospectos ({filteredLeads.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'documents' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Expedientes y Documentos ({filteredClientGroups.length} Clientes)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'config' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" /> Configuración de Notificaciones BD
        </button>
      </div>

      {/* PESTAÑA 1: SOLICITUDES Y LEADS REALES DE MYSQL */}
      {activeTab === 'leads' && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              Bandeja de Contactos Registrados
            </h2>
            <span className="text-xs text-slate-500 font-mono">Mostrando {filteredLeads.length} solicitudes</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando bandeja de solicitudes...</div>
          ) : filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Servicio / Interés</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Estatus</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{lead.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-sky-700">
                        {lead.phone}
                        <span className="block text-[10px] text-slate-500 font-sans">{lead.email || 'Sin correo'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-800 font-semibold">
                          {lead.serviceOfInterest}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{lead.branch}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-[10px]">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`https://wa.me/52${lead.phone.replaceAll(/\D/g, '')}?text=Hola%20${encodeURIComponent(lead.fullName)},%20te%20contactamos%20de%20GATSA%20respecto%20a%20tu%20solicitud.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Contactar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No se encontraron solicitudes que coincidan con la búsqueda o filtro.
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: DOCUMENTOS ORGANIZADOS POR CLIENTE Y TRÁMITE */}
      {activeTab === 'documents' && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Expedientes de Clientes y Documentos Adjuntos
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Mostrando {filteredClientGroups.length} cliente(s) con expediente
            </span>
          </div>

          <div className="space-y-6">
            {filteredClientGroups && filteredClientGroups.length > 0 ? (
              filteredClientGroups.map((group) => (
                <div key={group.userId} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                  
                  {/* Ficha de Perfil del Cliente */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 font-mono">
                        CLIENTE ID: #{group.userId}
                      </span>
                      <h3 className="font-black text-slate-900 text-lg">{group.clientName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Tel: <strong className="text-slate-700">{group.clientPhone}</strong> • Correo: <strong className="text-slate-700">{group.clientEmail}</strong>
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/52${group.clientPhone.replaceAll(/\D/g, '')}?text=Hola%20${encodeURIComponent(group.clientName)},%20te%20contactamos%20de%20GATSA%20respecto%20a%20tus%20documentos.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition inline-flex items-center gap-1.5 w-fit"
                    >
                      <Phone className="w-3.5 h-3.5" /> WhatsApp Cliente
                    </a>
                  </div>

                  {/* Lista de Trámites de este Cliente */}
                  <div className="space-y-4 pt-1">
                    {group.procedures.map((proc) => (
                      <div key={proc.procedureId} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded font-mono font-bold text-xs">
                              {proc.procedureId}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{proc.serviceOfInterest}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            Sucursal: <strong>{proc.branch}</strong>
                          </span>
                        </div>

                        {/* Documentos de este Trámite */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {proc.documents && proc.documents.length > 0 ? (
                            proc.documents.map((doc) => (
                              <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{doc.documentType}</span>
                                    <span className="text-slate-500 font-mono text-[10px]">{doc.fileName}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleInspectDocument(doc.id, doc.fileName, doc.documentType, group.clientName)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3 text-sky-400" /> Ver
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-slate-400 text-[11px] italic py-1">
                              Pendiente de adjuntar documentos para este trámite.
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No se encontraron expedientes que coincidan con la búsqueda o filtro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONFIGURACIÓN DE NOTIFICACIONES Y SEGURIDAD */}
      {activeTab === 'config' && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-sky-600" />
            Configuración de Notificaciones BD (`system_configurations`)
          </h2>

          {configSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>¡Parámetros de notificación guardados exitosamente en la base de datos MySQL!</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Correo Corporativo Administrador / Agente (Llave: ADMIN_NOTIFICATION_EMAIL) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Todas las alertas operativas al cargarse documentos o recibir leads se enviarán a esta dirección configurada en la BD.
              </p>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Guardar Configuración en MySQL
            </button>
          </form>
        </div>
      )}

      {/* MODAL VISUALIZADOR SEGURO DE DOCUMENTO PARA ADMINISTRADOR */}
      {viewModalOpen && selectedDocInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <button
              type="button"
              onClick={() => {
                setViewModalOpen(false);
                if (docBlobUrl) URL.revokeObjectURL(docBlobUrl);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedDocInfo.docType}</h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong>{selectedDocInfo.clientName}</strong>
                </p>
              </div>
            </div>

            {/* ÁREA DE PREVISUALIZACIÓN */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[350px] flex items-center justify-center relative">
              {loadingDoc ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Clock className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                  <span>Obteniendo archivo cifrado desde el servidor GATSA...</span>
                </div>
              ) : docBlobUrl ? (
                <iframe
                  src={docBlobUrl}
                  className="w-full h-[450px] rounded-lg border-0"
                  title={selectedDocInfo.fileName}
                />
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No se pudo cargar la vista previa.
                </div>
              )}
            </div>

            {/* BARRA INFERIOR DE ACCIONES */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">
                Archivo: {selectedDocInfo.fileName}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  disabled={!docBlobUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> Descargar Archivo Original
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
