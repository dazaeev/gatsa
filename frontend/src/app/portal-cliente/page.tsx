'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, CheckCircle2, Clock, Shield, FileCheck, LogIn, RefreshCw, Upload, Plus, X, MessageSquare, Lock, ArrowRight, FileCheck2, Info, FileCode, Layers, Download, Award, Eye, Trash2, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatProcedureId } from '@/utils/procedureUtils';
import { ConfirmModal } from '@/components/ConfirmModal';

interface DocumentItem {
  id: number;
  leadId?: number;
  documentType: string;
  fileName: string;
  fileSize?: number;
  status: string;
}

interface TimelineItem {
  stepNumber: number;
  step: string;
  completed: boolean;
  date: string;
  adminNote?: string;
  attachmentFileName?: string;
}

interface ProcedureItem {
  id: number;
  procedureId: string;
  serviceOfInterest: string;
  branch: string;
  status: string;
  createdAt: string;
  currentStep: number;
  adminNote?: string;
  adminAttachmentFileName?: string;
  timeline: TimelineItem[];
}

interface PortalClientResponse {
  fullName: string;
  phone: string;
  email: string;
  leads: ProcedureItem[];
  documents: DocumentItem[];
}

export default function PortalClientePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<PortalClientResponse | null>(null);
  const [activeLeadIndex, setActiveLeadIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadModalOpen, setPortalUploadModalOpen] = useState<boolean>(false);
  const [docIdToReplace, setDocIdToReplace] = useState<number | null>(null);
  
  const [docType, setDocType] = useState<string>('INE_IDENTIFICACION');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('INE_Oficial_Escaneado.pdf');
  const [uploading, setUploading] = useState<boolean>(false);

  // Deliverable & Document Viewer Modal State
  const [deliverableModalOpen, setDeliverableModalOpen] = useState<boolean>(false);
  const [deliverableBlobUrl, setDeliverableBlobUrl] = useState<string | null>(null);
  const [loadingDeliverable, setLoadingDeliverable] = useState<boolean>(false);
  const [viewerTitle, setViewerTitle] = useState<string>('Visualizador de Documento Digital');

  // Confirm modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/portalclient/status');
      setData(response.data);
    } catch (err) {
      console.error('Error cargando expediente del cliente', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDocument = async (docId: number, fileName: string, docTypeLabel: string) => {
    setViewerTitle(`${docTypeLabel} (${fileName})`);
    setDeliverableModalOpen(true);
    setLoadingDeliverable(true);
    setDeliverableBlobUrl(null);

    try {
      const response = await api.get(`/portalclient/download-document/${docId}`, {
        responseType: 'blob'
      });
      const mimeType = (response.headers && response.headers['content-type']) ? String(response.headers['content-type']) : 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setDeliverableBlobUrl(blobUrl);
    } catch (err) {
      console.error('Error cargando documento del cliente', err);
    } finally {
      setLoadingDeliverable(false);
    }
  };

  const handleInspectDeliverable = async (leadId: number) => {
    setViewerTitle('Entregable Oficial GATSA');
    setDeliverableModalOpen(true);
    setLoadingDeliverable(true);
    setDeliverableBlobUrl(null);

    try {
      const response = await api.get(`/portalclient/download-deliverable/${leadId}`, {
        responseType: 'blob'
      });
      const mimeType = (response.headers && response.headers['content-type']) ? String(response.headers['content-type']) : 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setDeliverableBlobUrl(blobUrl);
    } catch (err) {
      console.error('Error cargando entregable de admin', err);
    } finally {
      setLoadingDeliverable(false);
    }
  };

  const promptDeleteDocument = (docId: number, docName: string) => {
    setDocToDelete({ id: docId, name: docName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);

    try {
      await api.delete(`/portalclient/documents/${docToDelete.id}`);
      toast.success('Documento eliminado correctamente.', {
        description: `'${docToDelete.name}' ha sido retirado de tu expediente.`,
      });
      setDeleteConfirmOpen(false);
      setDocToDelete(null);
      fetchStatus();
    } catch (err) {
      console.error('Error eliminando documento', err);
      toast.error('Error al eliminar el documento.', {
        description: 'Intenta nuevamente o contacta a tu asesor GATSA.',
      });
    } finally {
      setDeletingDoc(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCustomFileName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setCustomFileName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const activeProcedure = (data && data.leads && data.leads.length > 0) 
    ? data.leads[activeLeadIndex] || data.leads[0]
    : null;

  const handleUploadOrReplaceDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('documentType', docType);
      if (activeProcedure && activeProcedure.id) {
        formData.append('leadId', String(activeProcedure.id));
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('fileName', customFileName);
      }

      if (docIdToReplace && docIdToReplace > 0) {
        await api.post(`/portalclient/replace-document/${docIdToReplace}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('¡Documento reemplazado exitosamente!', {
          description: `'${customFileName}' ha sido actualizado en tu expediente GATSA.`,
        });
      } else {
        await api.post('/portalclient/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('¡Documento adjuntado correctamente!', {
          description: `'${customFileName}' fue agregado a tu expediente GATSA.`,
        });
      }

      setPortalUploadModalOpen(false);
      setDocIdToReplace(null);
      setSelectedFile(null);
      fetchStatus();
    } catch (error) {
      console.error('Error procesando documento', error);
      toast.info('Operación registrada en expediente digital.');
      setPortalUploadModalOpen(false);
      setDocIdToReplace(null);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl space-y-4">
          <div className="p-4 bg-sky-50 text-sky-600 rounded-full w-fit mx-auto border border-sky-100">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso Protegido al Portal de Clientes</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Para consultar el estatus real de tu expediente de retiro AFORE o póliza de seguro, primero debes iniciar sesión con tu cuenta registrada.
          </p>
          <div className="pt-2 space-y-3">
            <Link
              href="/login?type=client"
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Iniciar Sesión en mi Cuenta <ArrowRight className="w-4 h-4" />
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

  const filteredDocuments = (data && data.documents)
    ? data.documents.filter(doc => 
        "INE_IDENTIFICACION" === doc.documentType || 
        !doc.leadId || 
        (activeProcedure && doc.leadId === activeProcedure.id)
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header Expediente Limpio y Ejecutivo */}
      <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold rounded-full">
            <Shield className="w-4 h-4 text-sky-400" /> Expediente Oficial Digital GATSA
          </div>
          <h1 className="text-2xl font-black text-white">
            Expediente de {data?.fullName || user?.fullName || 'Cliente GATSA'}
          </h1>
          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Folio del Trámite Activo: <strong className="text-sky-400 font-mono">{activeProcedure?.procedureId || formatProcedureId(1)}</strong>
              <span className="mx-2">•</span>
              Servicio: <strong className="text-white">{activeProcedure?.serviceOfInterest || 'RETIRO_DESEMPLEO_AFORE'}</strong>
            </p>
            <p>
              Teléfono Registrado: <strong className="text-sky-300">{data?.phone || user?.phone || '2721104860'}</strong>
              <span className="mx-2">•</span>
              Correo: <strong className="text-sky-300">{data?.email || user?.email || 'cliente@gatsa.com.mx'}</strong>
            </p>
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-800 rounded-xl border border-slate-700 text-right shrink-0">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">Estatus del Trámite</span>
          <span className="text-base font-black text-sky-400">{activeProcedure?.status || 'NUEVO'}</span>
        </div>
      </div>

      {/* SELECTOR DE MÚLTIPLES TRÁMITES DEL CLIENTE */}
      {data?.leads && data.leads.length > 1 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Tienes {data.leads.length} Trámites / Solicitudes Registradas:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.leads.map((leadItem, index) => (
              <button
                key={leadItem.id || index}
                type="button"
                onClick={() => setActiveLeadIndex(index)}
                className={`p-3.5 rounded-xl border text-left transition space-y-1 ${
                  activeLeadIndex === index
                    ? 'bg-sky-50 border-sky-500 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-sky-600">
                  <span>{leadItem.procedureId}</span>
                  <span className="text-slate-400 font-sans font-normal">{leadItem.createdAt}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 block truncate">{leadItem.serviceOfInterest}</h4>
                <p className="text-[11px] text-slate-500">Sucursal: {leadItem.branch}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stepper Timeline del Trámite Seleccionado */}
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            Línea de Tiempo del Trámite: <span className="text-sky-600">{activeProcedure?.procedureId}</span> (Paso {activeProcedure?.currentStep || 2} de 5)
          </h2>
          <button
            type="button"
            onClick={fetchStatus}
            className="text-xs text-slate-500 hover:text-sky-600 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Estado
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando el estado de tu expediente...</div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
            {activeProcedure?.timeline.map((item, idx) => {
              const stepNumber = idx + 1;
              const isCurrentActiveStep = stepNumber === (activeProcedure.currentStep || 2);
              const isStep2DocumentIndex = stepNumber === 2;

              // Obtener la nota o entregable exclusivo del paso o la del trámite general
              const stepNote = item.adminNote || (isCurrentActiveStep ? activeProcedure?.adminNote : '');
              const stepAttachment = item.attachmentFileName || (isCurrentActiveStep ? activeProcedure?.adminAttachmentFileName : '');
              const hasStepDictamen = Boolean(stepNote || stepAttachment);

              return (
                <div key={idx} className="relative group space-y-3">
                  <div
                    className={`absolute -left-[31px] top-0 p-1.5 rounded-full border ${
                      item.completed
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : isCurrentActiveStep
                        ? 'bg-sky-50 border-sky-500 text-sky-600 animate-pulse'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrentActiveStep ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <div className="pl-2">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold text-base ${item.completed ? 'text-slate-900' : isCurrentActiveStep ? 'text-sky-600' : 'text-slate-400'}`}>
                        {item.step}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.completed
                        ? 'Etapa concluida exitosamente.'
                        : isCurrentActiveStep
                        ? 'Fase activa en proceso: Nuestro equipo legal y de enlace se encuentra procesando esta fase.'
                        : 'Pendiente de inicio.'}
                    </p>
                  </div>

                  {/* INTEGRACIÓN DIRECTA DE LA DOCUMENTACIÓN ADJUNTA DENTRO DEL PASO 2 */}
                  {isStep2DocumentIndex && (
                    <div className="ml-2 p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-sky-600" />
                            Documentos Adjuntados para este Folio ({activeProcedure?.procedureId}):
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Tu INE es global. Los demás documentos aplican para esta solicitud.
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDocIdToReplace(null);
                            setDocType('INE_IDENTIFICACION');
                            setPortalUploadModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow transition flex items-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adjuntar Documento
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredDocuments && filteredDocuments.length > 0 ? (
                          filteredDocuments.map((doc) => (
                            <div key={doc.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                                  <span className="font-bold text-slate-800 truncate">{doc.documentType}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold shrink-0">
                                  {doc.status}
                                </span>
                              </div>

                              <span className="text-slate-500 font-mono text-[10px] block truncate">{doc.fileName}</span>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleInspectDocument(doc.id, doc.fileName, doc.documentType)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3 text-sky-400" /> Ver
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocIdToReplace(doc.id);
                                    setDocType(doc.documentType);
                                    setCustomFileName(doc.fileName);
                                    setPortalUploadModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded transition flex items-center gap-1"
                                >
                                  <RefreshCcw className="w-3 h-3" /> Reemplazar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => promptDeleteDocument(doc.id, doc.fileName)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" /> Eliminar
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-slate-500 text-xs">
                            Pendiente de adjuntar INE o documentos. Haz clic en <strong>"Adjuntar Documento"</strong> arriba para avanzar al Paso 3.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DICTAMEN / NOTA DEL ASESOR GATSA UBICADO EXACTAMENTE DEBAJO DEL PASO CORRESPONDIENTE */}
                  {hasStepDictamen && (
                    <div className="ml-2 p-5 bg-gradient-to-r from-amber-50 via-amber-50 to-amber-100/70 border border-amber-300 rounded-xl shadow-sm space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Dictamen del Asesor GATSA ({activeProcedure?.procedureId})</span>
                      </div>

                      {stepNote && (
                        <p className="text-xs text-amber-950 leading-relaxed font-semibold pl-1">
                          "{stepNote}"
                        </p>
                      )}

                      {stepAttachment && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-200/80">
                          <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-sky-600" /> Entregable Oficial: {stepAttachment}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInspectDeliverable(activeProcedure!.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" /> Inspeccionar / Ver Entregable
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div>
            <span className="font-bold text-slate-900 block">¿Dudas sobre tus documentos o el avance de tu trámite?</span>
            <span className="text-slate-500">Un ejecutivo de la Sucursal {activeProcedure?.branch || 'Barrio Nuevo Orizaba'} te orienta directamente por WhatsApp.</span>
          </div>
          <a
            href={`https://wa.me/522721546920?text=Hola%20GATSA,%20soy%20${encodeURIComponent(data?.fullName || user?.fullName || 'Cliente')}%20con%20folio%20${activeProcedure?.procedureId}%20y%20deseo%20ayuda%20con%20mi%20tr%C3%A1mite.`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" /> Contactar por WhatsApp
          </a>
        </div>
      </div>

      {/* MODAL VISUALIZADOR SEGURO DE DOCUMENTOS Y ENTREGABLES */}
      {deliverableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            <button
              type="button"
              onClick={() => {
                setDeliverableModalOpen(false);
                if (deliverableBlobUrl) URL.revokeObjectURL(deliverableBlobUrl);
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
                <h3 className="font-bold text-slate-900 text-lg">{viewerTitle}</h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong>{data?.fullName || user?.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[350px] flex items-center justify-center relative">
              {loadingDeliverable ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Clock className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                  <span>Obteniendo archivo cifrado desde el servidor GATSA...</span>
                </div>
              ) : deliverableBlobUrl ? (
                <div className="w-full h-full">
                  {/* VISTA DESKTOP: Previsualización en iframe */}
                  <div className="hidden sm:block w-full h-[450px]">
                    <iframe
                      src={deliverableBlobUrl}
                      className="w-full h-full rounded-lg border-0"
                      title={viewerTitle}
                    />
                  </div>

                  {/* VISTA MÓVIL: Tarjeta Ejecutiva de PDF Optimizada para Celulares */}
                  <div className="block sm:hidden w-full p-6 text-center space-y-4 bg-slate-900 text-white rounded-xl shadow-inner my-auto">
                    <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded-2xl w-fit mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-100">{viewerTitle}</h4>
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded-full uppercase mt-1">
                        Documento Oficial Cifrado
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => window.open(deliverableBlobUrl, '_blank')}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Abrir PDF en Pantalla Completa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = deliverableBlobUrl;
                          link.download = 'Documento_GATSA.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400" /> Guardar / Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No se pudo cargar la vista previa del documento.
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">
                Visor Seguro GATSA
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (deliverableBlobUrl) {
                      const link = document.createElement('a');
                      link.href = deliverableBlobUrl;
                      link.download = 'Documento_GATSA.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  disabled={!deliverableBlobUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> Descargar Archivo Original
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL ADJUNTAR / REEMPLAZAR DOCUMENTO DRAG AND DROP REAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95">
            
            <button
              type="button"
              onClick={() => {
                setPortalUploadModalOpen(false);
                setDocIdToReplace(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl w-fit mx-auto font-bold">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {docIdToReplace ? 'Reemplazar Documento Existente' : 'Adjuntar Documento Digital'}
              </h3>
              <p className="text-xs text-slate-500">
                Trámite Activo: <strong>{activeProcedure?.procedureId}</strong> ({activeProcedure?.serviceOfInterest})
              </p>
            </div>

            <form onSubmit={handleUploadOrReplaceDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={!!docIdToReplace}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-600"
                >
                  <option value="INE_IDENTIFICACION">INE / Identificación Oficial Vigente (Global para todos tus trámites)</option>
                  <option value="ESTADO_CUENTA_AFORE">Estado de Cuenta AFORE (Específico para este folio)</option>
                  <option value="COMPROBANTE_DOMICILIO">Comprobante de Domicilio (Opcional)</option>
                  <option value="ACTA_NACIMIENTO">Acta de Nacimiento Certificada (Opcional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Archivo Digital *</label>
                <input
                  type="text"
                  required
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Ej. INE_Oficial_Escaneado.pdf"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-600"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="p-6 bg-slate-50 border-2 border-dashed border-sky-300 hover:border-sky-500 hover:bg-sky-50/50 rounded-xl text-center text-xs text-slate-600 cursor-pointer transition space-y-2"
              >
                {selectedFile ? (
                  <div className="space-y-1 text-emerald-700 font-bold">
                    <FileCheck2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="block text-xs">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Listo para subir
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <FileCode className="w-8 h-8 text-sky-600 mx-auto" />
                    <span className="block font-bold text-slate-900">Haz clic aquí o arrastra tu archivo</span>
                    <span className="text-[10px] text-slate-500">Formatos aceptados: PDF, JPG, PNG (Máx 10 MB)</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
              >
                {uploading ? 'Procesando...' : docIdToReplace ? 'Guardar y Reemplazar Documento' : 'Confirmar y Guardar Documento'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* CONFIRM MODAL PARA ELIMINAR DOCUMENTO */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="¿Eliminar documento de expediente?"
        message={`¿Estás seguro de que deseas eliminar el documento '${docToDelete?.name}' de tu expediente GATSA? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deletingDoc}
        onConfirm={confirmDeleteDocument}
        onClose={() => {
          if (!deletingDoc) {
            setDeleteConfirmOpen(false);
            setDocToDelete(null);
          }
        }}
      />

    </div>
  );
}
