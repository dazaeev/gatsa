#  ECOSISTEMA DIGITAL GATSA v1.2.0-PROD
## **Plataforma Fintech Multitenant de Servicios Financieros, Patrimoniales & Red B2B de Proveeduría Digital**

[![Java](https://img.shields.io/badge/Java-17%2B-007396?style=for-the-badge&logo=java&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.1-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

---

#  TABLA DE CONTENIDOS GLOBAL

* [1. Visión Ejecutiva y Propuesta de Valor Comercial](#1-visión-ejecutiva-y-propuesta-de-valor-comercial)
* [2. Arquitectura del Sistema e Infraestructura Técnica](#2-arquitectura-del-sistema-e-infraestructura-técnica)
* [3. MANUAL TÉCNICO Y DE ARQUITECTURA (Para Desarrolladores y DevOps)](#3-manual-técnico-y-de-arquitectura-para-desarrolladores-y-devops)
  * [3.1. Requisitos de Entorno y Configuración de Servicios](#31-requisitos-de-entorno-y-configuración-de-servicios)
  * [3.2. Modelo de Datos Entidad-Relación en MySQL](#32-modelo-de-datos-entidad-relación-en-mysql)
  * [3.3. Seguridad, Autenticación JWT y Roles RBAC](#33-seguridad-autenticación-jwt-y-roles-rbac)
  * [3.4. Mecanismos de Concurrencia (Locking) e Idempotencia Financiera](#34-mecanismos-de-concurrencia-locking-e-idempotencia-financiera)
  * [3.5. Especificación de la API RESTful (Endpoints)](#35-especificación-de-la-api-restful-endpoints)
* [4. MANUAL DE USUARIO Y OPERATIVO (Para Clientes, Socios y Administradores)](#4-manual-de-usuario-y-operativo-para-clientes-socios-y-administradores)
  * [4.1. Módulo Web Público (Simulador AFORE, Cotizadores y Prospección)](#41-módulo-web-público-simulador-afore-cotizadores-y-prospección)
  * [4.2. Módulo de Autenticación Unificada (/login)](#42-módulo-de-autenticación-unificada-login)
  * [4.3. Manual de Uso: Portal de Clientes B2C (/portal-cliente)](#43-manual-de-uso-portal-de-clientes-b2c-portal-cliente)
  * [4.4. Manual de Uso: Portal de Socios B2B - Punto de Venta Digital (/portal-socio)](#44-manual-de-uso-portal-de-socios-b2b---punto-de-venta-digital-portal-socio)
  * [4.5. Manual de Uso: Panel Administrador Corporativo (/admin-dashboard)](#45-manual-de-uso-panel-administrador-corporativo-admin-dashboard)
* [5. Matriz de Estados, Flujos Cruzados y Reglas de Negocio](#5-matriz-de-estados-flujos-cruzados-y-reglas-de-negocio)
* [6. Guía de Instalación, Compilación y Despliegue en Producción](#6-guía-de-instalación-compilación-y-despliegue-en-producción)

---

# 1. VISIÓNEJECUTIVA Y PROPUESTA DE VALOR COMERCIAL

El **Ecosistema Digital GATSA** es una solución tecnológica integral de grado Enterprise que transforma la manera en que se distribuyen, gestionan y operan los servicios patrimoniales y financieros en México (Retiro por Desempleo AFORE, Créditos Mejoravit, Seguros y Servicios Digitales).

###  Los 4 Pilares de Negocio de la Solución:

```
  ┌─────────────────────────┐   ┌─────────────────────────┐
  │   1. CAPTACIÓN B2C      │   │   2. EXPEDIENTE B2C     │
  │ Prospección web con     │   │ Portal cliente para     │
  │ simuladores de retiro y │   │ carga de INE y mapa de  │
  │ cotizador de seguros.   │   │ avance en tiempo real.  │
  └────────────┬────────────┘   └────────────┬────────────┘
               │                             │
               └──────────────┬──────────────┘
                              │
                              ▼
  ┌───────────────────────────┴───────────────────────────┐
  │         PLAFATORMA INTEGRADA GATSA v1.2.0-PROD        │
  └───────────────────────────┬───────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
  ┌────────────┴────────────┐   ┌────────────┴────────────┐
  │   3. RED SOCIOS B2B     │   │   4. PANEL ADMIN        │
  │ Monedero prepago, venta │   │ Dictaminación oficial,  │
  │ de servicios en cibers/ │   │ auditoría de wallets y  │
  │ papelerías y comisiones.│   │ control B2B en vivo.    │
  └─────────────────────────┘   └─────────────────────────┘
```

1. **Captación de Clientes de Alto Valor (B2C):** Simuladores interactivos en tiempo real que permiten calcular el retiro de recursos de la AFORE bajo normatividad CONSAR / IMSS.
2. **Autogestión Transparente del Cliente:** Portal cliente intuitivo donde la persona consulta el estatus de su trámite, sube su identificacion oficial (INE) y descarga sus dictámenes oficiales en PDF.
3. **Monetización y Red B2B de Proveeduría (Punto de Venta Digital):** "Convierte a cualquier papelería, ciber o negocio de barrio en una Franquicia Digital GATSA". Permite a aliados comerciales emitir servicios express (Actas de Nacimiento, CSF del SAT, Reportes de Buró) con descuento de monedero prepago y ganar comisiones de **$500.00 MXN** por canalizar clientes.
4. **Gobierno Corporativo y Control Total (Admin):** Panel unificado con buscador inteligente por folio, dictaminación con candados de seguridad, control de expedientes y administración global de la red B2B.

---

# 2. ARQUITECTURA DEL SISTEMA E INFRAESTRUCTURA TÉCNICA

La plataforma utiliza una arquitectura limpia desacoplada (**Decoupled Architecture**), comunicando el frontend y el backend mediante servicios API RESTful cifrados sobre JWT:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                            │
│                 Next.js 16.3.8 (React 19) + Tailwind CSS               │
│               App Router | TypeScript | Lucide Components              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON (Axios + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE NEGOCIO                               │
│                   Java 17 LTS + Spring Boot 3.3.1                      │
│        Spring Security | Spring Data JPA | Lombok | Email Service      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Hibernate ORM / SQL
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE PERSISTENCIA                          │
│                     Base de Datos Relacional MySQL 8.0                 │
│         Atómica | Bloqueo Pesimista | Idempotencia | Auditoría         │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 3. MANUAL TÉCNICO Y DE ARQUITECTURA

*Dirigido a Arquitectos de Software, Desarrolladores Full Stack y Administradores de Infraestructura.*

### 3.1. Requisitos de Entorno y Configuración de Servicios
* **Java Development Kit (JDK):** Versión 17 LTS o superior.
* **Build Tool Backend:** Apache Maven 3.9+.
* **Node.js / Runtime Frontend:** Node.js v20.0+ y npm v10.0+.
* **Motor de Base de Datos:** MySQL 8.0+.

#### Archivo de Propiedades Backend (`backend/src/main/resources/application.properties`):
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/gatsa_ecosystem?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
app.jwt.secret=9a2f8c7e6b5d4c3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a
app.jwt.expiration-milliseconds=86400000
```

---

### 3.2. Modelo de Datos Entidad-Relación en MySQL

El sistema gestiona 8 tablas relacionales principales en la base de datos `gatsa_ecosystem`:

```
┌───────────────┐        ┌─────────────────┐        ┌─────────────────────────┐
│     users     │ 1 ─── *│  public_leads   │ 1 ─── *│ b2b_partner_referrals   │
├───────────────┤        ├─────────────────┤        ├─────────────────────────┤
│ id (PK)       │        │ id (PK)         │        │ id (PK)                 │
│ full_name     │        │ full_name       │        │ partner_id (FK)         │
│ phone         │        │ phone           │        │ lead_id (FK)            │
│ email         │        │ service_of_int. │        │ commission_amount       │
│ password      │        │ status          │        │ status                  │
│ role          │        │ created_at      │        │ created_at              │
└───────┬───────┘        └─────────────────┘        └─────────────────────────┘
        │ 1
        │
        │ 1              ┌─────────────────┐        ┌─────────────────────────┐
        └─── 1 ─────────>│  b2b_partners   │ 1 ─── *│ b2b_wallet_transactions │
                         ├─────────────────┤        ├─────────────────────────┤
                         │ id (PK)         │        │ id (PK)                 │
                         │ user_id (FK)    │        │ partner_id (FK)         │
                         │ business_name   │        │ transaction_code        │
                         │ balance         │        │ type (CREDIT/DEBIT)     │
                         │ credit_limit    │        │ amount                  │
                         │ status          │        │ balance_after           │
                         └─────────────────┘        └─────────────────────────┘
```

---

### 3.3. Seguridad, Autenticación JWT y Roles RBAC

La seguridad está implementada mediante **Spring Security con JSON Web Tokens (JWT) Stateless**:

* **Filtro de Autenticación (`JwtAuthenticationFilter.java`):** Intercepta cada petición HTTP leyendo el encabezado `Authorization: Bearer <token>`, valida la firma criptográfica HMAC-SHA256 y carga el objeto `SecurityContextHolder`.
* **Matriz de Permisos por Rol (Role-Based Access Control - RBAC):**
  * `ROLE_CLIENT`: Acceso exclusivo a `/portalclient/**` (consultar sus trámites y subir su INE).
  * `ROLE_PARTNER`: Acceso exclusivo a `/b2bpartner/**` (monedero, catálogo B2B, canalización de clientes y compras).
  * `ROLE_ADMIN`: Acceso total a `/admin/**` (dictaminación, gestión de expedientes y control del ecosistema B2B).

---

### 3.4. Mecanismos de Concurrencia (Locking) e Idempotencia Financiera

#### A. Concurrencia Atómica del Monedero (Pessimistic Locking)
Para evitar que un socio realice dos compras simultáneas y deje su monedero con saldo negativo, el repositorio JPA utiliza **Bloqueo Pesimista de Escritura (`PESSIMISTIC_WRITE`)**:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Partner p WHERE p.user.id = :userId")
Optional<Partner> findByUserIdWithPessimisticLock(@Param("userId") Long userId);
```
**Efecto:** MySQL bloquea la fila del socio durante la transacción (`SELECT ... FOR UPDATE`), garantizando que las lecturas y cobros sean estrictamente secuenciales.

#### B. Idempotencia Anti-Duplicados (`X-Idempotency-Key`)
Para evitar cobros dobles por clics repetidos o desconexiones de red, la API `/b2bpartner/purchase-service` exige una clave de idempotencia única:
```java
if (serviceOrderRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
    return ResponseEntity.ok(Map.of("message", "Orden procesada previamente (Idempotente)"));
}
```

---

### 3.5. Especificación de la API RESTful (Endpoints Principales)

#### Autenticación (`/auth`)
* `POST /auth/login`: Autentica credenciales (Correo o Celular de 10 dígitos) y devuelve el Token JWT con los datos del usuario.

#### Módulo B2B / Socios (`/b2bpartner`)
* `GET /b2bpartner/wallet`: Obtiene el saldo en vivo, crédito, folios y lista de transacciones/referidos del socio autenticado.
* `GET /b2bpartner/services`: Retorna el catálogo oficial de servicios B2B activos con sus precios mayoristas y comisiones.
* `POST /b2bpartner/recharge`: Abona saldo al monedero prepago en MySQL y genera el recibo `TX-XXXX`.
* `POST /b2bpartner/purchase-service`: Ejecuta la compra de un servicio descontando del monedero con bloqueo pesimista y generando la orden `ORD-2026-XXXX`.
* `POST /b2bpartner/referrals`: Registra un cliente prospecto, valida el candado de celular único y crea automáticamente la cuenta de usuario en `users`.

#### Módulo Administrador (`/admin`)
* `GET /admin/leads?page=0&size=15&search=&branch=ALL`: Consulta paginada en servidor de solicitudes con buscador inteligente de folios.
* `POST /admin/leads/{id}/status`: Actualiza el estatus del trámite, guarda notas y adjunta el PDF del entregable oficial. Si el estatus cambia a `CONCLUIDO`, **abona automáticamente $500.00 MXN al monedero del socio canalizador**.
* `GET /admin/b2b/dashboard`: Devuelve las métricas consolidadas del ecosistema B2B (saldo global, comisiones pagadas, socios activos).
* `POST /admin/b2b/wallets/adjustment`: Realiza un ajuste financiero manual controlado en el monedero de un socio con nota de auditoría.

---

# 4. MANUAL DE USUARIO Y OPERATIVO

*Dirigido a Clientes B2C, Aliados Comerciales B2B y Administradores Corporativos.*

---

### 4.1. Módulo Web Público (Simulador AFORE, Cotizadores y Prospección)
Acceso libre en `http://localhost:3000`:
* **Simulador AFORE:** Ingrese sus semanas cotizadas y salario registrado para obtener la proyección de retiro por desempleo en Modalidad A y B.
* **Cotizador de Seguros:** Capture sus datos para recibir una propuesta personalizada de Pólizas de Vida, Auto o Gastos Médicos.
* **Directorio de Sucursales:** Consulte los datos de contacto y WhatsApp directo *(272 154 6920)* de nuestras oficinas.

---

### 4.2. Módulo de Autenticación Unificada (`/login`)
* **Acceso Simplificado:** Ingrese su correo electrónico o su número celular de 10 dígitos.
* **Contraseña Inicial B2C:** Si solicitó asesoría en la web o sucursal, su contraseña inicial son los **mismos 10 dígitos de su celular**.

---

### 4.3. Manual de Uso: Portal de Clientes B2C (`/portal-cliente`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ PORTAL DE CLIENTES B2C                                                 │
│ • Consultar Folio Oficial: GATSA-2026-1033                             │
│ • Mapa de Avance (Timeline): Seguimiento gráfico del Paso 1 al 5      │
│ • Expediente Digital: Subir foto/PDF de la INE y comprobantes          │
│ • Descarga de Entregables: Visualizar y descargar dictámenes en PDF    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Consulta de Trámite:** Al ingresar, verá en la cabecera su **Folio Oficial** (ej. `GATSA-2026-1033`).
2. **Mapa de Avance (5 Pasos):** Visualice la etapa actual de su trámite (*Solicitud Recibida*, *Integración de Papelería*, *Validación CONSAR*, *Emisión de Cheque*, *Conclusión*).
3. **Carga de INE:** Arrastre o seleccione la imagen/PDF de su credencial INE y presione **`Subir INE Oficial`**.
4. **Descargar Dictamen:** En la sección inferior, presione **`Ver / Descargar Entregable`** para guardar su comprobante oficial en PDF.

---

### 4.4. Manual de Uso: Portal de Socios B2B - Punto de Venta Digital (`/portal-socio`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ PORTAL DE SOCIOS B2B                                                   │
│ • Monedero Prepago: Saldo en vivo, límite de crédito y folios.         │
│ • [+ Recargar Monedero]: Abono inmediato por SPEI/Tarjeta.             │
│ • [+ Canalizar Cliente]: Registra prospectos ($500 MXN comisión).      │
│ • Catálogo B2B: Emisión de Actas, CSF y Buró con Ticket Imprimible.    │
│ • Estado de Cuenta: Historial filtrable de cargos y abonos.            │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Recarga de Monedero Prepago:
1. Haga clic en **`+ Recargar Monedero Prepago`**.
2. Seleccione el monto ($500, $1,000, $2,000 o $5,000 MXN) y confirme.
3. El saldo se reflejará instantáneamente en su **Saldo Disponible Monedero**.

#### B. Emisión Express de Servicios (Catálogo B2B):
1. Vaya a la pestaña **`Catálogo de Servicios B2B`**.
2. Seleccione el servicio deseado:
   * *Acta de Nacimiento Oficial* (Costo socio: $75 MXN | Precio público: $120 MXN | **Ganancia: $45 MXN**).
   * *Constancia de Situación Fiscal SAT* (Costo socio: $50 MXN | Precio público: $90 MXN | **Ganancia: $40 MXN**).
   * *Reporte de Buró de Crédito Especial* (Costo socio: $110 MXN | Precio público: $180 MXN | **Ganancia: $70 MXN**).
3. Presione **`Emitir Servicio`**, ingrese la CURP/Nombre del cliente y confirme.
4. El sistema descontará el saldo y desplegará la modal del **Ticket Digital** con el botón **`Imprimir Ticket`**.

#### C. Canalización de Clientes Referidos ($500.00 MXN Comisión):
1. Haga clic en **`+ Canalizar Cliente ($500 Comisión)`**.
2. Capture el Nombre y el Celular de 10 dígitos WhatsApp del cliente.
3. **Candado Anti-Duplicados:** Si el celular ya existe en GATSA, la plataforma detendrá el registro protegiendo la transparencia de comisiones.
4. **Auto-Registro B2C:** El servidor crea la cuenta de usuario para el cliente (Usuario = Celular / Contraseña = Celular) y envía la solicitud a Corporativo.
5. **Abono de Comisión (Fase 4):** Cuando Corporativo GATSA concluye el trámite, **se abonan automáticamente +$500.00 MXN a su monedero**.

---

### 4.5. Manual de Uso: Panel Administrador Corporativo (`/admin-dashboard`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ PANEL ADMINISTRADOR CORPORATIVO GATSA                                  │
│ • Buscador Inteligente: Búsqueda exacta por Folio (ej. 1033) o Nombre  │
│ • Pestaña 1 (Solicitudes): Dictaminar avance y adjuntar entregables    │
│ • Pestaña 2 (Expedientes): Inspección de INE y control de archivos     │
│ • Pestaña 3 (Notificaciones): Correos corporativos de alerta en BD     │
│ • Pestaña 4 (Gestión B2B): Métricas, wallets de socios y ajustes       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Buscador Inteligente Universal:** Ingrese el folio exacto (ej. `1033` o `GATSA-2026-1033`). El sistema filtrará directamente el trámite deseado.
2. **Dictaminación de Trámites (Pestaña 1):**
   * Presione **`Dictaminar`** en la solicitud del cliente.
   * Seleccione el nuevo estatus (*DOCUMENTOS_RECIBIDOS*, *EN_VALIDACION_CONSAR*, *CHEQUE_EMITIDO*, *CONCLUIDO*).
   * Adjunte el archivo PDF entregable oficial y guarde.
   * **Candado de Seguridad:** Si un trámite ya está `CONCLUIDO`, el botón se transforma en ` Trámite Concluido` con opción de ` Reabrir` bajo confirmación.
3. **Gestión Ecosistema B2B (Pestaña 4):**
   * Muestra el Saldo Global en Monederos, Comisiones Pagadas y Comisiones Pendientes.
   * **Activar/Suspender Socio:** Bloquee o active a un socio comercial con un clic.
   * **Ajustar Wallet:** Modal para realizar cargos o abonos administrativos manuales con nota de justificación.

---

# 5. MATRIZ DE ESTADOS, FLUJOS CRUZADOS Y REGLAS DE NEGOCIO

### Ciclo de Vida Completo de un Trámite B2B Referenciado:

```
 [1. Socio B2B Canaliza Prospecto] ──> [2. Registro en MySQL] ──> [3. Admin Dictamina CONCLUIDO]
     Nombre: María Sánchez                 `public_leads`             En Pestaña 1 de /admin-dashboard
     Celular: 2721112233                   Status: NUEVO              cambia estatus a CONCLUIDO.
     Comisión Pendiente: $500              `users` (ROLE_CLIENT)      
                                           User: 2721112233                       │
                                           Pass: 2721112233                       ▼
                                                                  [4. Acreditación Automática]
                                                                      Referido  CONCLUIDO_PAGADO
                                                                      Abono +$500 MXN a Wallet Socio
                                                                      Transacción CREDIT TX-XXXX
```

---

# 6. GUÍA DE INSTALACIÓN, COMPILACIÓN Y DESPLIEGUE EN PRODUCCIÓN

### 1. Clonar el Repositorio
```bash
git clone https://github.com/gatsa-servicios/ecosistema-digital.git
cd ecosistema-digital
```

### 2. Compilar y Arrancar el Back-End (Spring Boot Java 17)
```bash
cd backend
mvn clean compile -DskipTests
mvn spring-boot:run
```
*El backend iniciará en `http://localhost:8080` e inicializará las tablas MySQL automáticamente.*

### 3. Compilar y Arrancar el Front-End (Next.js 16)
```bash
cd frontend
npm install
npm run build
npm run start
```
*El frontend estará disponible en `http://localhost:3000` con la versión `v1.2.0-PROD` activa.*

---

**Desarrollado y Certificado por:** Equipo de Ingeniería y Arquitectura de Software GATSA  
**Estado:** Producción / Operativo (`v1.2.0-PROD`)
