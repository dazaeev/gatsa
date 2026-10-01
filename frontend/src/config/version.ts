/**
     * Configuración Centralizada de Versión de la Plataforma GATSA.
     * Modifica este archivo o la variable de entorno NEXT_PUBLIC_APP_VERSION para cambiar la versión global.
     */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v1.2.0-PROD';
export const APP_ENV = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
