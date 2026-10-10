'use client';

import React from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          icon: <Trash2 className="w-6 h-6" />,
          btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          icon: <AlertTriangle className="w-6 h-6" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
        };
      default:
        return {
          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
          icon: <Info className="w-6 h-6" />,
          btn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${vStyles.iconBg}`}>
              {vStyles.icon}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">GATSA Asesoría Patrimonial</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50 ${vStyles.btn}`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
