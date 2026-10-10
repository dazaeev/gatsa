'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShieldAlert, Users, Phone, Search, FileText, Settings, Save, CheckCircle2, Lock, LogIn, ArrowRight, Eye, Download, X, FileCheck2, Clock, Layers, Building2, Mail, Edit3, ChevronLeft, ChevronRight, Award, RefreshCcw, Trash2, UserCheck, ChevronDown, ChevronUp, LayoutList, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatProcedureId } from '@/utils/procedureUtils';
import { APP_VERSION } from '@/config/version';
import { ConfirmModal } from '@/components/ConfirmModal';

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

interface BranchItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
}

interface TeamMember {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  active: boolean;
  branchName: string;
  branchCode: string;
}

export default function AdminDashboardPage() {
  const { isAuthenticated, user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN' || user?.role === 'ROLE_ADMIN';
  const isGerente = user?.role === 'ROLE_GERENTE_SUCURSAL';
  const isAgente = user?.role === 'ROLE_AGENTE_COMPLETO';
  const isOperadorImss = user?.role === 'ROLE_OPERADOR_IMSS';
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clientGroups, setClientGroups] = useState<ClientDocumentGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  useEffect(() => {
    if (user && !isSuperAdmin && user.branch) {
      setBranchFilter(user.branch);
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState<'leads' | 'imss' | 'documents' | 'branches' | 'team' | 'config'>('leads');

  // Sucursales y Equipo
  const [branchesList, setBranchesList] = useState<BranchItem[]>([]);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);

  // Formularo Nueva Sucursal (Super Admin)
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchCode, setNewBranchCode] = useState<string>('');
  const [newBranchAddress, setNewBranchAddress] = useState<string>('');
  const [newBranchPhone, setNewBranchPhone] = useState<string>('');

  // Formulario Nuevo Empleado/Colaborador (Super Admin / Gerente)
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamPhone, setNewTeamPhone] = useState<string>('');
  const [newTeamEmail, setNewTeamEmail] = useState<string>('');
  const [newTeamPass, setNewTeamPass] = useState<string>('');
  const [newTeamRole, setNewTeamRole] = useState<string>('ROLE_AGENTE_COMPLETO');
  const [newTeamBranchCode, setNewTeamBranchCode] = useState<string>('');

  useEffect(() => {
    if (branchesList && branchesList.length > 0) {
      const defaultCode = String(branchesList[0].code || branchesList[0].id || '');
      if (defaultCode && !newTeamBranchCode) {
        setNewTeamBranchCode(defaultCode);
      }
    }
  }, [branchesList]);

  // Toggle para Acordeón Raw Data
  const [showRawImssResponse, setShowRawImssResponse] = useState<boolean>(false);
  const [imssCurp, setImssCurp] = useState<string>('');
  const [imssTipoCorreo, setImssTipoCorreo] = useState<string>('hotmail');
  const [imssCookie, setImssCookie] = useState<string>('');
  const [imssUser, setImssUser] = useState<string>('everth');
  const [imssPass, setImssPass] = useState<string>('Everth01*');
  const [loadingJordanLogin, setLoadingJordanLogin] = useState<boolean>(false);
  const [loadingImss, setLoadingImss] = useState<boolean>(false);
  const [imssResult, setImssResult] = useState<any>(null);
  const [imssHistory, setImssHistory] = useState<any[]>([]);

  // MODO VISTA: 'grouped' (Agrupada por Cliente) o 'flat' (Lista de todos los folios)
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedClientKeys, setExpandedClientKeys] = useState<Record<string, boolean>>({});

  // Confirm Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    loading?: boolean;
    action?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // PAGINACIÓN OPCIÓN A (SERVER-SIDE)
  const [leadPage, setLeadPage] = useState<number>(1);
  const [totalLeadPages, setTotalLeadPages] = useState<number>(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState<number>(0);
  const leadItemsPerPage = 15;

  const [docPage, setDocPage] = useState<number>(1);
  const [totalDocPages, setTotalDocPages] = useState<number>(1);
  const [totalDocsCount, setTotalDocsCount] = useState<number>(0);
  const docItemsPerPage = 15;

  const [imssPage, setImssPage] = useState<number>(1);
  const [totalImssPages, setTotalImssPages] = useState<number>(1);
  const [totalImssCount, setTotalImssCount] = useState<number>(0);
  const [imssSearchTerm, setImssSearchTerm] = useState<string>('');
  const imssItemsPerPage = 15;

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
    if (isAuthenticated && (isSuperAdmin || isGerente || isAgente || isOperadorImss)) {
      if (isOperadorImss) {
        setActiveTab('imss');
      }
      
      // Si NO es Super Admin, inicializar el branchFilter con la sucursal asignada en lugar de 'ALL'
      if (!isSuperAdmin && user?.branch) {
        setBranchFilter(user.branch);
      }

      fetchAdminData();
      fetchImssHistory();
      
      if (isSuperAdmin) {
        fetchBranches();
      }
      if (isSuperAdmin || isGerente) {
        fetchTeam();
      }
    } else {
      setLoading(false);
      setAccessDenied(true);
    }
  }, [isAuthenticated, user, leadPage, docPage, imssPage, searchTerm, imssSearchTerm, branchFilter]);

  const fetchBranches = async () => {
    try {
      const resp = await api.get('/publicsite/branches');
      setBranchesList(resp.data || []);
    } catch (err) {
      console.error('Error cargando sucursales', err);
    }
  };

  const fetchTeam = async () => {
    try {
      const resp = await api.get('/admin/team');
      setTeamList(resp.data || []);
    } catch (err) {
      console.error('Error cargando equipo de trabajo', err);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/branches', {
        name: newBranchName,
        code: newBranchCode,
        address: newBranchAddress,
        phone: newBranchPhone,
      });
      toast.success(`¡Sucursal ${newBranchName} creada exitosamente!`);
      setNewBranchName('');
      setNewBranchCode('');
      setNewBranchAddress('');
      setNewBranchPhone('');
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear la sucursal.');
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const effectiveBranchCode = isSuperAdmin ? newTeamBranchCode : (user?.branch || newTeamBranchCode);
      await api.post('/admin/team', {
        fullName: newTeamName,
        phone: newTeamPhone,
        email: newTeamEmail,
        password: newTeamPass,
        role: newTeamRole,
        branchCode: effectiveBranchCode,
      });
      toast.success(`¡Colaborador '${newTeamName}' registrado con éxito!`);
      setNewTeamName('');
      setNewTeamPhone('');
      setNewTeamEmail('');
      setNewTeamPass('');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar al colaborador.');
    }
  };

  useEffect(() => {
    setLeadPage(1);
    setDocPage(1);
  }, [searchTerm, branchFilter, viewMode]);

  const fetchAdminData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const promises: Promise<any>[] = [
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
      ];

      if (isSuperAdmin) {
        promises.push(api.get('/admin/config'));
      }

      const results = await Promise.all(promises);
      const leadsResp = results[0];
      const docsResp = results[1];
      const configResp = isSuperAdmin ? results[2] : null;

      if (leadsResp && leadsResp.data && leadsResp.data.content) {
        setLeads(leadsResp.data.content);
        setTotalLeadPages(leadsResp.data.totalPages || 1);
        setTotalLeadsCount(leadsResp.data.totalElements || 0);
      } else if (leadsResp) {
        setLeads(Array.isArray(leadsResp.data) ? leadsResp.data : []);
      }

      if (docsResp && docsResp.data && docsResp.data.content) {
        setClientGroups(docsResp.data.content);
        setTotalDocPages(docsResp.data.totalPages || 1);
        setTotalDocsCount(docsResp.data.totalElements || 0);
      } else if (docsResp) {
        setClientGroups(Array.isArray(docsResp.data) ? docsResp.data : []);
      }

      if (configResp && configResp.data) {
        if (configResp.data.adminEmail) setAdminEmail(configResp.data.adminEmail);
        if (configResp.data.imssCookie) setImssCookie(configResp.data.imssCookie);
        if (configResp.data.imssUser) setImssUser(configResp.data.imssUser);
        if (configResp.data.imssPass) setImssPass(configResp.data.imssPass);
      }
    } catch (error: any) {
      console.warn('Carga de datos parcial en panel operativo', error);
      if (error.response && error.response.status === 401) {
        setAccessDenied(true);
        logout();
      }
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

      toast.success('¡Dictamen guardado correctamente!', {
        description: `Para ${targetProcedureId}. El estatus cambió a '${newStatus}' y se notificó al cliente.`,
      });
      setDictamenModalOpen(false);
      fetchAdminData();
    } catch (err) {
      console.error('Error guardando dictamen', err);
      toast.error('Error guardando dictamen en el servidor.');
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

  const handleDeleteDeliverable = (dictamenId: number) => {
    setConfirmModalState({
      isOpen: true,
      title: '¿Eliminar entregable oficial?',
      message: '¿Estás seguro de que deseas eliminar este entregable emitido? Esta acción removerá el archivo del expediente del cliente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      action: async () => {
        setConfirmModalState(prev => ({ ...prev, loading: true }));
        try {
          await api.delete(`/admin/deliverables/${dictamenId}`);
          toast.success('Entregable eliminado exitosamente.');
          fetchAdminData();
        } catch (err) {
          console.error('Error eliminando entregable', err);
          toast.error('Error eliminando el entregable.');
        } finally {
          setConfirmModalState(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
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
      await api.post('/admin/config', { 
        adminEmail,
        imssUser,
        imssPass,
        imssCookie
      });
      setConfigSuccess(true);
      toast.success('Configuración de notificaciones guardada en BD.');
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error('Error guardando configuración', err);
      toast.error('Error guardando la configuración de notificaciones en BD.');
    }
  };

  const handleForceJordanLogin = async () => {
    setLoadingJordanLogin(true);
    try {
      const resp = await api.post('/admin/imss/login-refresh');
      if (resp.data && resp.data.cookie) {
        setImssCookie(resp.data.cookie);
        toast.success('¡Autenticación exitosa!', {
          description: 'La cookie con Jordan Digital ha sido renovada.',
        });
      }
    } catch (err: any) {
      console.error('Error probando login Jordan', err);
      toast.error(err.response?.data?.message || 'Error al autenticar con Jordan Digital. Verifica usuario y contraseña.');
    } finally {
      setLoadingJordanLogin(false);
    }
  };

  const fetchImssHistory = async () => {
    try {
      const resp = await api.get('/admin/imss/history', {
        params: {
          page: imssPage - 1,
          size: imssItemsPerPage,
          search: imssSearchTerm.trim(),
          branch: branchFilter,
        },
      });

      if (resp.data && resp.data.content) {
        setImssHistory(resp.data.content);
        setTotalImssPages(resp.data.totalPages || 1);
        setTotalImssCount(resp.data.totalElements || 0);
      } else if (Array.isArray(resp.data)) {
        setImssHistory(resp.data);
        setTotalImssCount(resp.data.length);
      }
    } catch (err) {
      console.error('Error cargando historial de archivos IMSS', err);
    }
  };

  const handleConsultarSemanasImss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imssCurp) return;
    setLoadingImss(true);
    setImssResult(null);

    try {
      const resp = await api.post('/admin/imss/consultar-semanas', {
        curp: imssCurp.toUpperCase().trim(),
        tipoCorreo: imssTipoCorreo,
      });

      setImssResult(resp.data);
      fetchImssHistory();

      // Descarga automática y apertura en visor si fue exitoso
      if (resp.data && resp.data.pdfFileName) {
        handleDownloadAndInspectImssPdf(resp.data.pdfFileName, `Reporte Semanas ${resp.data.curp}`);
      }
    } catch (err: any) {
      console.error('Error en consulta IMSS', err);
      const errMsg = err.response?.data?.message || 'Error al comunicarse con el servicio de Jordan Digital IMSS.';
      toast.error(`Error en consulta IMSS: ${errMsg}`);
    } finally {
      setLoadingImss(false);
    }
  };

  const handleDownloadAndInspectImssPdf = async (fileName: string, titleName: string) => {
    setSelectedDocInfo({ id: 99999, fileName, docType: 'Semanas Cotizadas IMSS', clientName: titleName });
    setViewModalOpen(true);
    setLoadingDoc(true);
    setDocBlobUrl(null);

    try {
      const response = await api.get('/admin/imss/download-pdf', {
        params: { file: fileName },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);

      // Solo en laptops/desktop dispara la descarga automática en segundo plano. En móviles se abre el modal responsivo.
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      if (!isMobile) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error al descargar y visualizar el PDF del IMSS', err);
      toast.error('Error al descargar el archivo PDF del IMSS.');
    } finally {
      setLoadingDoc(false);
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

  if (!isAuthenticated || (!isSuperAdmin && !isGerente && !isAgente && !isOperadorImss) || accessDenied) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-full w-fit mx-auto shadow">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso Restringido - Área Corporativa</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se requieren credenciales activas de colaborador corporativo de <strong>Grupo GATSA</strong>.
          </p>
          <div className="pt-2 space-y-3">
            <Link
              href="/login"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-sky-400" /> Iniciar Sesión <ArrowRight className="w-4 h-4" />
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
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-12 space-y-4 sm:space-y-8">
      
      {/* Admin Header */}
      <div className="p-4 sm:p-8 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold rounded-full mb-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" /> Panel de Control Administrador GATSA
            <span className="ml-2 px-2 py-0.5 bg-sky-500/30 text-sky-200 text-[10px] font-mono rounded-full font-bold border border-sky-400/40">
              {APP_VERSION}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Gestión Centralizada de Solicitudes y Documentos</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisión en tiempo real de expedientes, INE cargados y notificaciones en BD.</p>
        </div>

        <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-center w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">Total Solicitudes</span>
          <span className="text-lg sm:text-xl font-bold text-sky-400">{totalLeadsCount} Registros</span>
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
            disabled={!isSuperAdmin}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSuperAdmin && <option value="ALL">Todas las Sucursales</option>}
            {branchesList.map((b) => (
              <option key={b.id} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Selector de Pestañas del Admin - Touch Friendly Scroll */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 text-xs font-bold no-scrollbar">
        {!isOperadorImss && (
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'leads' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" /> Solicitudes ({groupedLeadsList.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('imss')}
          className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'imss' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" /> Semanas IMSS
        </button>

        {!isOperadorImss && (
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'documents' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" /> Expedientes ({filteredClientGroups.length})
          </button>
        )}

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'branches' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" /> Sucursales ({branchesList.length})
          </button>
        )}

        {(isSuperAdmin || isGerente) && (
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'team' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" /> Mi Equipo ({teamList.length})
          </button>
        )}

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'config' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" /> Configuración API
          </button>
        )}
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
                                        setConfirmModalState({
                                          isOpen: true,
                                          title: 'Reabrir dictamen de trámite',
                                          message: `El trámite ${proc.procedureId} se encuentra actualmente en estatus CONCLUIDO. ¿Deseas reabrir el dictamen para actualizar el estatus o adjuntar un nuevo entregable?`,
                                          confirmText: 'Sí, reabrir dictamen',
                                          cancelText: 'Cancelar',
                                          variant: 'warning',
                                          action: () => {
                                            openDictamenModal(proc.leadId, proc.procedureId, proc.serviceOfInterest, proc.status);
                                            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                                          },
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded text-[10px] transition flex items-center gap-1 cursor-pointer"
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

      {/* PESTAÑA DE CONSULTA SEMANAS COTIZADAS IMSS (JORDAN DIGITAL) */}
      {activeTab === 'imss' && (
        <div className="p-4 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-600 shrink-0" />
                Consulta Automatizada de Semanas Cotizadas IMSS
              </h2>
              <p className="text-xs text-slate-500">
                Integra automáticamente el flujo de Jordan Digital (Procesar, Estados y Descarga Directa PDF).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Formulario de Consulta Directa */}
            <div className="lg:col-span-1 p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-sky-600" /> Ejecutar Consulta
              </h3>

              <form onSubmit={handleConsultarSemanasImss} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CURP del Trabajador *</label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="Ej. LOLA871016HGTPPL15"
                    value={imssCurp}
                    onChange={(e) => setImssCurp(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Correo Proveedor</label>
                  <select
                    value={imssTipoCorreo}
                    onChange={(e) => setImssTipoCorreo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-600"
                  >
                    <option value="hotmail">Hotmail / Outlook</option>
                    <option value="gmail">Gmail</option>
                    <option value="yahoo">Yahoo</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loadingImss || !imssCurp}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loadingImss ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin text-sky-200" /> Procesando en Jordan Digital...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Consultar y Obtener PDF
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resultados y Descargas de PDF */}
            <div className="lg:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" /> Resultado de la Consulta
              </h3>

              {imssResult ? (
                <div className="space-y-4">
                  <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm">
                    
                    {/* Encabezado con Estado Certificado */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-sky-600 uppercase font-mono tracking-wider">
                          CONSULTA CERTIFICADA DE SEMANAS
                        </span>
                        <h4 className="text-base font-black text-slate-900">
                          {(() => {
                            if (imssResult.estadoResponse) {
                              for (const k of Object.keys(imssResult.estadoResponse)) {
                                const item = imssResult.estadoResponse[k];
                                if (item && item.nombre) return item.nombre;
                              }
                            }
                            return 'Trabajador IMSS';
                          })()}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Consulta Completada
                        </span>
                      </div>
                    </div>

                    {/* Ficha Técnica de Detalles de la Consulta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">CURP Registrada</span>
                        <span className="font-mono font-bold text-slate-900">{imssResult.curp}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Folio de Rastreo (SID)</span>
                        <span className="font-mono font-bold text-sky-700">{imssResult.sid || 'N/A'}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Archivo Generado</span>
                        <span className="font-mono font-bold text-slate-900 truncate block" title={imssResult.pdfFileName}>
                          {imssResult.pdfFileName || 'Reporte_Semanas.pdf'}
                        </span>
                      </div>
                    </div>

                    {/* Bloque Destacado de Descarga y Visor */}
                    {imssResult.pdfUrl ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-600 text-white rounded-lg">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-950">Documento Oficial Listo para Entrega</p>
                            <p className="text-[11px] text-emerald-800">Se ha descargado y abierto en el visor de documentos de GATSA.</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (imssResult.pdfFileName) {
                              handleDownloadAndInspectImssPdf(imssResult.pdfFileName, `Reporte Semanas ${imssResult.curp}`);
                            }
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> Abrir Visor / Re-descargar
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                        <p className="font-bold">Solicitud procesada en el servidor externo.</p>
                        <p className="mt-1">Si el archivo aún no aparece, vuelva a presionar el botón de consultar en unos momentos.</p>
                      </div>
                    )}

                    {/* Acordeón Oculto de Debugging Técnico (Raw Data) */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowRawImssResponse(!showRawImssResponse)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                      >
                        {showRawImssResponse ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showRawImssResponse ? 'Ocultar respuesta técnica (Raw JSON)' : 'Ver detalles técnicos de la consulta (Solo Soporte/Admin)'}
                      </button>

                      {showRawImssResponse && (
                        <pre className="mt-2 p-3 bg-slate-900 text-sky-300 text-[10px] font-mono rounded-lg overflow-x-auto max-h-48 animate-in fade-in">
                          {JSON.stringify(imssResult, null, 2)}
                        </pre>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                  <Award className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">Ingresa la CURP a la izquierda para iniciar la consulta automatizada.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN DE CONTROL DE ARCHIVOS Y AUDITORÍA DE CONSULTAS DE SEMANAS IMSS */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" /> Registro de Auditoría e Historial de Consultas ({totalImssCount})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Historial de consultas ejecutadas por los empleados de tu sucursal con paginación server-side.
                </p>
              </div>

              {/* BUSCADOR DEDICADO Y BOTÓN DE REFRESCO */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por CURP, SID o nombre..."
                    value={imssSearchTerm}
                    onChange={(e) => setImssSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setImssPage(1);
                        fetchImssHistory();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImssPage(1);
                    fetchImssHistory();
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" /> Buscar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImssSearchTerm('');
                    setImssPage(1);
                    fetchImssHistory();
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Actualizar y Limpiar Filtros"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {imssHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-xs">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50">
                        <th className="py-3 px-4">CURP / Folio</th>
                        <th className="py-3 px-4">Empleado Operador</th>
                        <th className="py-3 px-4">Sucursal</th>
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {imssHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span className="text-[10px] text-sky-600 block">{item.sid ? `SID: ${item.sid}` : 'IMSS'}</span>
                            {item.curp || item.fileName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {item.userFullName || 'Operador GATSA'}
                            {item.userRole && (
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">
                                {item.userRole}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded font-bold text-[10px]">
                              {item.branchCode || 'MATRIZ'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('es-MX') : 'Reciente'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownloadAndInspectImssPdf(item.fileName, `Archivo IMSS ${item.curp || item.fileName}`)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" /> Abrir Visor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINACIÓN HISTORIAL IMSS */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Página <strong>{imssPage}</strong> de <strong>{totalImssPages}</strong> ({totalImssCount} consultas en total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={imssPage === 1}
                      onClick={() => setImssPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      type="button"
                      disabled={imssPage === totalImssPages}
                      onClick={() => setImssPage(p => Math.min(totalImssPages, p + 1))}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                No se encontraron registros de auditoría que coincidan con la búsqueda o filtro.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: GESTIÓN DE SUCURSALES (SUPER ADMIN) */}
      {activeTab === 'branches' && isSuperAdmin && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                Gestión Centralizada de Sucursales (Super Admin Exclusivo)
              </h2>
              <p className="text-xs text-slate-500">
                Alta y administración de sucursales físicas y corporativas de Grupo GATSA.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Agregar Sucursal */}
            <div className="lg:col-span-1 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" /> Registrar Nueva Sucursal
              </h3>

              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Sucursal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sucursal Córdoba Centro"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Único (Identificador) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CORDOBA_CENTRO"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Física</label>
                  <input
                    type="text"
                    placeholder="Ej. Av. 1 #405 Col. Centro"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. 2711002030"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" /> Crear Sucursal
                </button>
              </form>
            </div>

            {/* Listado de Sucursales Existentes */}
            <div className="lg:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" /> Sucursales Registradas ({branchesList.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branchesList.map((b) => (
                  <div key={b.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-mono font-bold">
                        {b.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                        {b.active ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{b.name}</h4>
                    {b.address && <p className="text-xs text-slate-500">{b.address}</p>}
                    {b.phone && <p className="text-xs font-mono text-slate-600">Tel: {b.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: MI EQUIPO DE TRABAJO (SUPER ADMIN Y GERENTES) */}
      {activeTab === 'team' && (isSuperAdmin || isGerente) && (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                Gestión de Colaboradores y Roles por Sucursal
              </h2>
              <p className="text-xs text-slate-500">
                Alta y administración de Gerentes, Agentes Operativos y Operadores IMSS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Registrar Colaborador */}
            <div className="lg:col-span-1 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600" /> Registrar Nuevo Empleado
              </h3>

              <form onSubmit={handleCreateTeamMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 2721112233"
                    value={newTeamPhone}
                    onChange={(e) => setNewTeamPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. empleado@gatsa.com.mx"
                    value={newTeamEmail}
                    onChange={(e) => setNewTeamEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña de Acceso *</label>
                  <input
                    type="password"
                    required
                    placeholder="******"
                    value={newTeamPass}
                    onChange={(e) => setNewTeamPass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol Operativo *</label>
                  <select
                    value={newTeamRole}
                    onChange={(e) => setNewTeamRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-600"
                  >
                    {isSuperAdmin && <option value="ROLE_GERENTE_SUCURSAL">Gerente de Sucursal</option>}
                    <option value="ROLE_AGENTE_COMPLETO">Agente Operativo Completo</option>
                    <option value="ROLE_OPERADOR_IMSS">Operador Solo Consultas IMSS</option>
                  </select>
                </div>

                {isSuperAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal Asignada *</label>
                    <select
                      value={newTeamBranchCode}
                      onChange={(e) => setNewTeamBranchCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-600"
                    >
                      {branchesList.map((b) => (
                        <option key={b.id || b.code} value={b.code || b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Registrar Empleado
                </button>
              </form>
            </div>

            {/* Lista del Equipo */}
            <div className="lg:col-span-2 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" /> Plantilla de Personal ({teamList.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamList.map((m) => (
                  <div key={m.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-mono font-bold">
                        {m.role}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {m.branchName}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{m.fullName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{m.email} • Tel: {m.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: CONFIGURACIÓN NOTIFICACIONES Y APIS */}
      {activeTab === 'config' && isSuperAdmin && (
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

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credenciales de Proveedor API Jordan Digital</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario Jordan Digital</label>
                  <input
                    type="text"
                    value={imssUser}
                    onChange={(e) => setImssUser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Jordan Digital</label>
                  <input
                    type="password"
                    value={imssPass}
                    onChange={(e) => setImssPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleForceJordanLogin}
                disabled={loadingJordanLogin}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {loadingJordanLogin ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-sky-400" />}
                {loadingJordanLogin ? 'Autenticando en Jordan...' : '🔑 Probar Credenciales y Generar Cookie Actual'}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Cookie de Sesión Guardada (Llave: IMSS_JORDAN_COOKIE)
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="session=.eJwlzkFqAzEMBdC7e..."
                  value={imssCookie}
                  onChange={(e) => setImssCookie(e.target.value)}
                  className="w-full font-mono text-[11px] p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Copia la cookie completa de tu navegador o Postman (<code>session=.eJwl...</code>) para autenticar peticiones a <strong>jordan-digital.com</strong>.
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
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
            
            <button
              type="button"
              onClick={() => {
                setViewModalOpen(false);
                if (docBlobUrl) URL.revokeObjectURL(docBlobUrl);
              }}
              className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 pr-8">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl font-bold shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="truncate">
                <h3 className="font-bold text-slate-900 text-sm sm:text-lg truncate">{selectedDocInfo.docType}</h3>
                <p className="text-xs text-slate-500 truncate">
                  Cliente: <strong>{selectedDocInfo.clientName}</strong>
                </p>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[280px] sm:min-h-[350px] flex items-center justify-center relative">
              {loadingDoc ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Clock className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                  <span>Obteniendo archivo cifrado desde el servidor GATSA...</span>
                </div>
              ) : docBlobUrl ? (
                <div className="w-full h-full">
                  {/* VISTA DESKTOP: Previsualización en iframe */}
                  <div className="hidden sm:block w-full h-[450px]">
                    <iframe
                      src={docBlobUrl}
                      className="w-full h-full rounded-lg border-0"
                      title={selectedDocInfo.fileName}
                    />
                  </div>

                  {/* VISTA MÓVIL: Tarjeta Ejecutiva de PDF Optimizada para Celulares */}
                  <div className="block sm:hidden w-full p-6 text-center space-y-4 bg-slate-900 text-white rounded-xl shadow-inner my-auto">
                    <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded-2xl w-fit mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-100">{selectedDocInfo.docType}</h4>
                      <p className="text-[11px] text-sky-300 font-mono break-all">{selectedDocInfo.fileName}</p>
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded-full uppercase mt-1">
                        Documento Certificado Oficial
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => window.open(docBlobUrl, '_blank')}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Abrir PDF en Pantalla Completa
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400" /> Guardar / Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* CONFIRM MODAL REUTILIZABLE */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        variant={confirmModalState.variant}
        loading={confirmModalState.loading}
        onConfirm={() => {
          if (confirmModalState.action) {
            confirmModalState.action();
          }
        }}
        onClose={() => {
          if (!confirmModalState.loading) {
            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />

    </div>
  );
}
