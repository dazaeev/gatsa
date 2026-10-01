'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, Phone, Search, FileText, Settings, Save, CheckCircle2, Lock, LogIn, ArrowRight, Eye, Download, X, FileCheck2, Clock, Layers, Building2, Mail, Edit3, ChevronLeft, ChevronRight, Award, RefreshCcw, Trash2, UserCheck, ChevronDown, ChevronUp, LayoutList, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatProcedureId } from '@/utils/procedureUtils';
import { APP_VERSION } from '@/config/version';

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
  adminNote?: string;
  adminAttachmentFileName?: string;
  documents: DocMapItem[];
  deliverables?: {
    id: number;
    stepNumber: number;
    status: string;
    adminNote: string;
    fileName: string;
  }[];
}

interface ClientDocumentGroup {
  userId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  procedures: ProcedureAdminItem[];
}

interface GroupedLeadClient {
  clientKey: string;
  fullName: string;
  phone: string;
  email: string;
  branch: string;
  totalRequests: number;
  latestLead: Lead;
  leads: Lead[];
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

  // MODO VISTA: 'grouped' (Agrupada por Cliente) o 'flat' (Lista de todos los folios)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedClientKeys, setExpandedClientKeys] = useState<Record<string, boolean>>({});

  // PAGINACIÓN OPCIÓN A (SERVER-SIDE)
  const [leadPage, setLeadPage] = useState<number>(1);
  const [totalLeadPages, setTotalLeadPages] = useState<number>(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const leadItemsPerPage = 15;

  const [docPage, setDocPage] = useState<number>(1);
  const [totalDocPages, setTotalDocPages] = useState<number>(1);
  const [totalDocsCount, setTotalDocsCount] = useState<number>(0);
  const docItemsPerPage = 15;

  const [adminEmail, setAdminEmail] = useState<string>('ing.dazaeev@gmail.com, oswaldonoealexa@gmail.com');
  const [configSuccess, setConfigSuccess] = useState<boolean>(false);

  // Viewer Modal State
  const [selectedDocInfo, setSelectedDocInfo] = useState<{ id: number; fileName: string; docType: string; clientName: string } | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);

  // Modal Dictamen/Estatus State
  const [dictamenModalOpen, setDictamenModalOpen] = useState<boolean>(false);
  const [targetLeadId, setTargetLeadId] = useState<number | null>(null);
  const [targetProcedureId, setTargetProcedureId] = useState<string>('');
  const [targetService, setTargetService] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('DOCUMENTOS_RECIBIDOS');
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [savingDictamen, setSavingDictamen] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ROLE_ADMIN') {
      fetchAdminData();
    } else {
      setLoading(false);
      setAccessDenied(true);
    }
  }, [isAuthenticated, user, leadPage, docPage, searchTerm, branchFilter]);

  useEffect(() => {
    setLeadPage(1);
    setDocPage(1);
  }, [searchTerm, branchFilter, viewMode]);

  const fetchAdminData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const [leadsResp, docsResp, configResp] = await Promise.all([
        api.get('/admin/leads', {
          params: {
            page: leadPage - 1,
            size: leadItemsPerPage,
            search: searchTerm,
            branch: branchFilter,
          },
        }),
        api.get('/admin/documents', {
          params: {
            page: docPage - 1,
            size: docItemsPerPage,
            search: searchTerm,
            branch: branchFilter,
          },
        }),
        api.get('/admin/config'),
      ]);

      if (leadsResp.data && leadsResp.data.content) {
        setLeads(leadsResp.data.content);
        setTotalLeadPages(leadsResp.data.totalPages || 1);
        setTotalLeadsCount(leadsResp.data.totalElements || 0);
      } else {
        setLeads(Array.isArray(leadsResp.data) ? leadsResp.data : []);
      }

      if (docsResp.data && docsResp.data.content) {
        setClientGroups(docsResp.data.content);
        setTotalDocPages(docsResp.data.totalPages || 1);
        setTotalDocsCount(docsResp.data.totalElements || 0);
      } else {
        setClientGroups(Array.isArray(docsResp.data) ? docsResp.data : []);
      }

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

  const toggleClientExpansion = (key: string) => {
    setExpandedClientKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const suggestNextLogicalStatus = (service: string, rawStatus: string) => {
    const s = service ? service.toUpperCase() : '';
    const st = rawStatus ? rawStatus.toUpperCase().trim() : 'NUEVO';

    if (s.includes('SEGURO') || s.includes('COTIZADOR')) {
      if (st === 'NUEVO') return 'DOCUMENTOS_RECIBIDOS';
      if (st === 'DOCUMENTOS_RECIBIDOS') return 'POLIZA_EN_EMISION';
      if (st === 'POLIZA_EN_EMISION') return 'PAGO_CONFIRMADO';
      if (st === 'PAGO_CONFIRMADO') return 'CONCLUIDO';
      return 'CONCLUIDO';
    } else if (s.includes('MEJORAVIT')) {
      if (st === 'NUEVO') return 'DOCUMENTOS_RECIBIDOS';
      if (st === 'DOCUMENTOS_RECIBIDOS') return 'AVALUO_MEJORAVIT';
      if (st === 'AVALUO_MEJORAVIT') return 'TARJETA_AUTORIZADA';
      if (st === 'TARJETA_AUTORIZADA') return 'CONCLUIDO';
      return 'CONCLUIDO';
    } else {
      if (st === 'NUEVO') return 'DOCUMENTOS_RECIBIDOS';
      if (st === 'DOCUMENTOS_RECIBIDOS') return 'EN_VALIDACION_CONSAR';
      if (st === 'EN_VALIDACION_CONSAR') return 'CHEQUE_EMITIDO';
      if (st === 'CHEQUE_EMITIDO') return 'CONCLUIDO';
      return 'CONCLUIDO';
    }
  };

  const openDictamenModal = (leadId: number, procedureId: string, service: string, currentStatus: string) => {
    setTargetLeadId(leadId);
    setTargetProcedureId(procedureId);
    setTargetService(service);
    
    const nextStep = suggestNextLogicalStatus(service, currentStatus);
    setNewStatus(nextStep);
    setAdminNoteInput('');
    setDeliverableFile(null);
    setDictamenModalOpen(true);
  };

  const handleSaveDictamen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLeadId) return;
    setSavingDictamen(true);

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('adminNote', adminNoteInput);
      if (deliverableFile) {
        formData.append('file', deliverableFile);
      }

      await api.post(`/admin/leads/${targetLeadId}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(`¡Dictamen guardado para ${targetProcedureId}! El estatus cambió a '${newStatus}' y se notificó al cliente.`);
      setDictamenModalOpen(false);
      fetchAdminData();
    } catch (err) {
      console.error('Error guardando dictamen', err);
      alert('Error guardando dictamen en el servidor.');
    } finally {
      setSavingDictamen(false);
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

  const handleInspectDeliverable = async (leadId: number, fileName: string, clientName: string) => {
    setSelectedDocInfo({ id: leadId, fileName, docType: 'Entregable Oficial GATSA', clientName });
    setViewModalOpen(true);
    setLoadingDoc(true);
    setDocBlobUrl(null);

    try {
      const response = await api.get(`/portalclient/download-deliverable/${leadId}`, {
        responseType: 'blob'
      });
      const mimeType = (response.headers && response.headers['content-type']) ? String(response.headers['content-type']) : 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);
    } catch (err) {
      console.error('Error cargando entregable de admin', err);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDeleteDeliverable = async (dictamenId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este entregable emitido?')) return;
    try {
      await api.delete(`/admin/deliverables/${dictamenId}`);
      alert('Entregable eliminado exitosamente.');
      fetchAdminData();
    } catch (err) {
      console.error('Error eliminando entregable', err);
      alert('Error eliminando el entregable.');
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

  const renderStatusOptions = (service: string) => {
    const s = service != null ? service.toUpperCase() : '';
    if (s.includes('MEJORAVIT')) {
      return (
        <>
          <option value="NUEVO">Paso 1: NUEVO (Solicitud Recibida)</option>
          <option value="DOCUMENTOS_RECIBIDOS">Paso 2: DOCUMENTOS_RECIBIDOS (Papeles Integrados)</option>
          <option value="AVALUO_MEJORAVIT">Paso 3: AVALUO_MEJORAVIT (Pre-Calificación)</option>
          <option value="TARJETA_AUTORIZADA">Paso 4: TARJETA_AUTORIZADA (Materiales)</option>
          <option value="CONCLUIDO">Paso 5: CONCLUIDO (Recursos Entregados)</option>
        </>
      );
    } else if (s.includes('SEGURO') || s.includes('COTIZADOR')) {
      return (
        <>
          <option value="NUEVO">Paso 1: NUEVO (Cotización Recibida)</option>
          <option value="DOCUMENTOS_RECIBIDOS">Paso 2: DOCUMENTOS_RECIBIDOS (Perfil Integrado)</option>
          <option value="POLIZA_EN_EMISION">Paso 3: POLIZA_EN_EMISION (Aseguradora)</option>
          <option value="PAGO_CONFIRMADO">Paso 4: PAGO_CONFIRMADO (Vigencia)</option>
          <option value="CONCLUIDO">Paso 5: CONCLUIDO (Póliza Activa)</option>
        </>
      );
    } else {
      return (
        <>
          <option value="NUEVO">Paso 1: NUEVO (Solicitud Recibida)</option>
          <option value="DOCUMENTOS_RECIBIDOS">Paso 2: DOCUMENTOS_RECIBIDOS (Papeles Integrados)</option>
          <option value="EN_VALIDACION_CONSAR">Paso 3: EN_VALIDACION_CONSAR (Dictamen)</option>
          <option value="CHEQUE_EMITIDO">Paso 4: CHEQUE_EMITIDO (Depósito)</option>
          <option value="CONCLUIDO">Paso 5: CONCLUIDO (Finiquito AFORE)</option>
        </>
      );
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const st = status ? status.toUpperCase() : 'NUEVO';
    if (st.includes('CONCLUIDO') || st.includes('CHEQUE') || st.includes('PAGO') || st.includes('TARJETA')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (st.includes('VALIDACION') || st.includes('EMISION') || st.includes('AVALUO') || st.includes('DOCUMENTOS')) {
      return 'bg-amber-50 text-amber-900 border-amber-200';
    }
    return 'bg-sky-50 text-sky-800 border-sky-200';
  };

  const filteredLeads = leads;

  const groupedLeadsMap: Record<string, GroupedLeadClient> = {};
  filteredLeads.forEach((lead) => {
    const key = lead.phone ? lead.phone.replaceAll(/\D/g, '') : lead.email.toLowerCase();
    if (!groupedLeadsMap[key]) {
      groupedLeadsMap[key] = {
        clientKey: key,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        branch: lead.branch,
        totalRequests: 0,
        latestLead: lead,
        leads: [],
      };
    }
    groupedLeadsMap[key].leads.push(lead);
    groupedLeadsMap[key].totalRequests += 1;
  });

  const groupedLeadsList = Object.values(groupedLeadsMap);

  const paginatedLeads = filteredLeads;
  const paginatedGroupedLeads = groupedLeadsList;

  const filteredClientGroups = clientGroups;
  const paginatedClientGroups = clientGroups;

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
            <span className="ml-2 px-2 py-0.5 bg-sky-500/30 text-sky-200 text-[10px] font-mono rounded-full font-bold border border-sky-400/40">
              {APP_VERSION}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Gestión Centralizada de Solicitudes y Documentos</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisión en tiempo real de expedientes, INE cargados y notificaciones en BD.</p>
        </div>

        <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-center">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Solicitudes</span>
          <span className="text-xl font-bold text-sky-400">{totalLeadsCount} Registros</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS POR SUCURSAL */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={`Buscar por cliente, teléfono, folio (ej. ${formatProcedureId(19)}) o servicio...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
          />
        </div>

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
          <Users className="w-4 h-4" /> Solicitudes y Prospectos ({groupedLeadsList.length} Clientes)
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

      {/* PESTAÑA 1: SOLICITUDES Y LEADS CON MODO DE VISTA AGRUPADO O LISTA Y PAGINACIÓN HOMOGÉNEA */}
      {activeTab === 'leads' && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                Bandeja de Contactos Registrados
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {viewMode === 'grouped' 
                  ? `Mostrando ${groupedLeadsList.length > 0 ? (leadPage - 1) * leadItemsPerPage + 1 : 0} - ${Math.min(leadPage * leadItemsPerPage, totalLeadsCount)} de ${totalLeadsCount} registro(s)`
                  : `Mostrando ${filteredLeads.length > 0 ? (leadPage - 1) * leadItemsPerPage + 1 : 0} - ${Math.min(leadPage * leadItemsPerPage, totalLeadsCount)} de ${totalLeadsCount} solicitud(es)`}
              </span>
            </div>

            {/* Toggle de Modo de Vista */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'grouped' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Agrupar por Cliente
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'flat' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" /> Lista Completa Folios
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando bandeja de solicitudes...</div>
          ) : viewMode === 'grouped' ? (
            paginatedGroupedLeads.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-4">
                  {paginatedGroupedLeads.map((group) => {
                    const isExpanded = !!expandedClientKeys[group.clientKey];
                    return (
                      <div key={group.clientKey} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-sky-600 text-white rounded-xl font-bold">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-base">{group.fullName}</h3>
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-full font-bold text-[10px]">
                                  {group.totalRequests} {group.totalRequests === 1 ? 'Solicitud' : 'Solicitudes'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">
                                Tel: <strong className="text-slate-700">{group.phone}</strong> • Correo: <strong className="text-slate-700">{group.email}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/52${group.phone.replaceAll(/\D/g, '')}?text=Hola%20${encodeURIComponent(group.fullName)},%20te%20contactamos%20de%20GATSA.`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" /> WhatsApp Cliente
                            </a>

                            <button
                              type="button"
                              onClick={() => toggleClientExpansion(group.clientKey)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              <span>{isExpanded ? 'Ocultar Folios' : 'Ver Folios'}</span>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Historial de Solicitudes Registradas ({group.leads.length}):
                            </span>
                            <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                              {group.leads.map((lead) => (
                                <div key={lead.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 text-xs">
                                  <div className="space-y-0.5">
                                    <span className="font-mono font-bold text-sky-600 text-xs block">
                                      {formatProcedureId(lead.id)}
                                    </span>
                                    <span className="font-bold text-slate-800">{lead.serviceOfInterest}</span>
                                    <span className="text-slate-500 block text-[11px]">Sucursal: {lead.branch}</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 border rounded-md font-bold text-[10px] ${getStatusBadgeStyle(lead.status)}`}>
                                      {lead.status}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const procId = formatProcedureId(lead.id);
                                        if (lead.status === 'CONCLUIDO') {
                                          if (confirm(`El trámite ${procId} ya está CONCLUIDO. ¿Deseas reabrir el dictamen?`)) {
                                            openDictamenModal(lead.id, procId, lead.serviceOfInterest, lead.status);
                                          }
                                        } else {
                                          openDictamenModal(lead.id, procId, lead.serviceOfInterest, lead.status);
                                        }
                                      }}
                                      className={`px-3 py-1 rounded font-bold transition text-[11px] flex items-center gap-1 shadow-xs ${
                                        lead.status === 'CONCLUIDO' 
                                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300' 
                                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                                      }`}
                                    >
                                      {lead.status === 'CONCLUIDO' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
                                      {lead.status === 'CONCLUIDO' ? 'Concluido' : 'Dictaminar'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CONTROL DE NAVEGACIÓN PAGINACIÓN LEADS */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Página <strong>{leadPage}</strong> de <strong>{totalLeadPages}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={leadPage === 1}
                      onClick={() => setLeadPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      type="button"
                      disabled={leadPage === totalLeadPages}
                      onClick={() => setLeadPage(p => Math.min(totalLeadPages, p + 1))}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No se encontraron contactos agrupados.
              </div>
            )
          ) : (
            paginatedLeads.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 px-4">Folio / Cliente</th>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4">Servicio / Interés</th>
                        <th className="py-3 px-4">Sucursal</th>
                        <th className="py-3 px-4">Estatus Actual</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedLeads.map((lead) => {
                        const procId = formatProcedureId(lead.id);
                        return (
                          <tr key={lead.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <span className="text-[10px] text-sky-600 font-mono block">{procId}</span>
                              {lead.fullName}
                            </td>
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
                              <span className={`px-2.5 py-1 border rounded-md font-bold text-[10px] ${getStatusBadgeStyle(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (lead.status === 'CONCLUIDO') {
                                    if (confirm(`El trámite ${procId} ya está CONCLUIDO. ¿Deseas reabrir el dictamen?`)) {
                                      openDictamenModal(lead.id, procId, lead.serviceOfInterest, lead.status);
                                    }
                                  } else {
                                    openDictamenModal(lead.id, procId, lead.serviceOfInterest, lead.status);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded font-bold transition inline-flex items-center gap-1 shadow ${
                                  lead.status === 'CONCLUIDO'
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                                }`}
                              >
                                {lead.status === 'CONCLUIDO' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Edit3 className="w-3 h-3" />}
                                {lead.status === 'CONCLUIDO' ? 'Concluido' : 'Dictaminar'}
                              </button>
                              <a
                                href={`https://wa.me/52${lead.phone.replaceAll(/\D/g, '')}?text=Hola%20${encodeURIComponent(lead.fullName)},%20te%20contactamos%20de%20GATSA%20respecto%20a%20tu%20tr%C3%A1mite%20${procId}.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition inline-flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" /> Contactar
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Página <strong>{leadPage}</strong> de <strong>{totalLeadPages}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={leadPage === 1}
                      onClick={() => setLeadPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      type="button"
                      disabled={leadPage === totalLeadPages}
                      onClick={() => setLeadPage(p => Math.min(totalLeadPages, p + 1))}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No se encontraron solicitudes que coincidan con la búsqueda o filtro.
              </div>
            )
          )}
        </div>
      )}

      {/* PESTAÑA 2: DOCUMENTOS ORGANIZADOS POR CLIENTE Y TRÁMITE CON PAGINACIÓN HOMOGÉNEA */}
      {activeTab === 'documents' && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Expedientes de Clientes y Control de Archivos
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Mostrando {Math.min((docPage - 1) * docItemsPerPage + 1, filteredClientGroups.length)} - {Math.min(docPage * docItemsPerPage, filteredClientGroups.length)} de {filteredClientGroups.length} cliente(s)
            </span>
          </div>

          <div className="space-y-6">
            {paginatedClientGroups && paginatedClientGroups.length > 0 ? (
              <div className="space-y-6">
                {paginatedClientGroups.map((group) => (
                  <div key={group.userId} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                    
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

                    <div className="space-y-4 pt-1">
                      {group.procedures.map((proc) => (
                        <div key={proc.procedureId} className="p-4 bg-white rounded-xl border border-slate-200 space-y-4 shadow-xs">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded font-mono font-bold text-xs">
                                {proc.procedureId}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{proc.serviceOfInterest}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-semibold">
                                Sucursal: <strong>{proc.branch}</strong> • Estatus: <strong className="text-sky-700">{proc.status}</strong>
                              </span>

                              {proc.leadId > 0 && (
                                proc.status === 'CONCLUIDO' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] flex items-center gap-1 shadow-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trámite Concluido
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`El trámite ${proc.procedureId} ya está CONCLUIDO. ¿Deseas reabrir el dictamen para modificar estatus o entregable?`)) {
                                          openDictamenModal(proc.leadId, proc.procedureId, proc.serviceOfInterest, proc.status);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded text-[10px] transition flex items-center gap-1"
                                      title="Reabrir dictamen excepcionalmente"
                                    >
                                      <Lock className="w-3 h-3 text-slate-500" /> Reabrir
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openDictamenModal(proc.leadId, proc.procedureId, proc.serviceOfInterest, proc.status)}
                                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded text-[11px] transition shadow-xs flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Dictaminar / Adjuntar Entregable
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* SECCIÓN A: DOCUMENTOS RECIBIDOS DEL CLIENTE */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Documentos Recibidos del Cliente ({proc.documents ? proc.documents.length : 0})
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {proc.documents && proc.documents.length > 0 ? (
                                proc.documents.map((doc) => (
                                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900 truncate">{doc.documentType}</span>
                                          {"INE_IDENTIFICACION" === doc.documentType ? (
                                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-bold">Global</span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[9px] font-bold">Folio</span>
                                          )}
                                        </div>
                                        <span className="text-slate-500 font-mono text-[10px] truncate block">{doc.fileName}</span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleInspectDocument(doc.id, doc.fileName, doc.documentType, group.clientName)}
                                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                                    >
                                      <Eye className="w-3 h-3 text-sky-400" /> Ver
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-slate-400 text-[11px] italic py-1">
                                  Pendiente de adjuntar documentos del cliente.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SECCIÓN B: ENTREGABLES OFICIALES EMITIDOS POR EL ADMINISTRADOR */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                              Entregables Oficiales Emitidos por GATSA ({proc.deliverables ? proc.deliverables.length : 0})
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {proc.deliverables && proc.deliverables.length > 0 ? (
                                proc.deliverables.map((deliv) => (
                                  <div key={deliv.id} className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <div className="truncate">
                                        <span className="font-bold text-emerald-950 block truncate">Paso {deliv.stepNumber}: {deliv.status}</span>
                                        <span className="text-emerald-800 font-mono text-[10px] truncate block">{deliv.fileName}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleInspectDeliverable(proc.leadId, deliv.fileName, group.clientName)}
                                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] transition flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3 text-sky-400" /> Ver
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => openDictamenModal(proc.leadId, proc.procedureId, proc.serviceOfInterest, proc.status)}
                                        className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 font-bold rounded text-[10px] transition flex items-center gap-1"
                                      >
                                        <RefreshCcw className="w-3 h-3" /> Reemplazar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDeliverable(deliv.id)}
                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded text-[10px] transition flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-600" /> Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-slate-400 text-[11px] italic py-1">
                                  No se han emitido archivos entregables para este trámite. Haz clic en <strong>"Dictaminar / Adjuntar Entregable"</strong> arriba para emitir uno.
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                ))}

                {/* CONTROL DE PAGINACIÓN EXPEDIENTES */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Página <strong>{docPage}</strong> de <strong>{totalDocPages}</strong> (Mostrando {paginatedClientGroups.length} clientes)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={docPage === 1}
                      onClick={() => setDocPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      type="button"
                      disabled={docPage === totalDocPages}
                      onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No se encontraron expedientes que coincidan con la búsqueda o filtro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONFIGURACIÓN DE NOTIFICACIONES Y SEGURIDAD MULTI-CORREO */}
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
                Correos Corporativos Administradores / Agentes (Llave: ADMIN_NOTIFICATION_EMAIL) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes ingresar múltiples correos electrónicos separados por comas (ej. <code>ing.dazaeev@gmail.com, oswaldonoealexa@gmail.com</code>).
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

      {/* MODAL DICTAMEN DE AVANCE Y ADJUNTO ENTREGABLE */}
      {dictamenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95">
            
            <button
              type="button"
              onClick={() => setDictamenModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b border-slate-100 pb-3">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit mx-auto font-bold">
                <Edit3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Dictaminar Avance de Trámite</h3>
              <p className="text-xs text-slate-500">
                Folio: <strong className="text-sky-600 font-mono">{targetProcedureId}</strong> ({targetService})
              </p>
            </div>

            <form onSubmit={handleSaveDictamen} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Estatus Destino *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600"
                >
                  {renderStatusOptions(targetService)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nota / Observación para el Cliente (Opcional)</label>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Ej. Tu póliza de Seguro ha sido emitida con la aseguradora Qualitas."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Adjuntar Archivo Entregable en PDF (Opcional)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => setDeliverableFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Puedes adjuntar la Póliza de Seguro, Comprobante de Cheque o Constancia Mejoravit.</p>
              </div>

              <button
                type="submit"
                disabled={savingDictamen}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm shadow transition flex items-center justify-center gap-2"
              >
                {savingDictamen ? 'Guardando Dictamen...' : 'Guardar Dictamen y Notificar al Cliente'}
              </button>
            </form>

          </div>
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
