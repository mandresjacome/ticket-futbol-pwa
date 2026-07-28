# Decisiones Técnicas - Ticket Fútbol PWA

Este archivo documenta las decisiones arquitectónicas importantes del proyecto para mantener consistencia y evitar contradicciones futuras.

---

## ADR-001: Stack Tecnológico del MVP (2026-07-28)

### Contexto
Necesitamos establecer el stack tecnológico inicial para el MVP priorizando herramientas gratuitas, sencillas y con buena documentación.

### Decisión
- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript con modo strict
- **UI:** React + Tailwind CSS
- **Base de datos:** Supabase (Free tier)
- **Despliegue:** Vercel (Hobby tier)
- **API de estadísticas:** **Provisional - pendiente evaluación** (candidato: API-Football Free)
- **Iconos:** Lucide React

**Aclaración:** API-Football se considera un candidato provisional para estadísticas deportivas. No se ha validado que el plan gratuito satisfaga los requerimientos del proyecto. Debe evaluarse a fondo antes de cualquier integración.

### Consecuencias
✅ Todas las herramientas tienen planes gratuitos generosos  
✅ Excelente DX (Developer Experience)  
✅ Documentación abundante  
⚠️ Límites del free tier deben monitorearse  
⚠️ Migraciones futuras si se superan los límites

---

## ADR-002: Arquitectura de Datos Simulados (2026-07-28)

### Contexto
Para el MVP inicial necesitamos datos de prueba antes de conectar Supabase y API-Football real.

### Decisión
Crear archivo `src/lib/mock-data.ts` con:
- Equipos, jugadores, partidos y tickets de ejemplo
- Funciones auxiliares (`getTicketById`, etc.)
- Datos separados de los componentes para facilitar reemplazo

### Consecuencias
✅ Desarrollo rápido sin dependencias externas  
✅ Fácil testing de la UI  
✅ Separación clara entre datos y presentación  
⚠️ Recordar reemplazar con datos reales en fase siguiente

---

## ADR-003: Estados de Selección (2026-07-28)

### Contexto
Las selecciones de un ticket pasan por diferentes estados durante su ciclo de vida.

### Decisión
Definir 8 estados principales:
- `upcoming` - Próxima
- `live_tracking` - En juego
- `currently_winning` - Se está cumpliendo
- `target_reached` - Objetivo alcanzado
- `lost` - Perdida
- `finished` - Finalizada
- `void` - Anulada
- `needs_review` - Requiere revisión

Claves en inglés, etiquetas en español.

### Consecuencias
✅ Estados claros y comprensibles  
✅ Cobertura completa del ciclo de vida  
✅ Preparado para internacionalización  
⚠️ Agregar estados adicionales requiere actualizar tipos y UI

---

## ADR-004: Navegación Mobile-First (2026-07-28)

### Contexto
La aplicación será principalmente usada en dispositivos móviles.

### Decisión
- Barra de navegación inferior fija (Bottom Navigation)
- 4 secciones principales: Inicio, Nuevo Ticket, Historial, Perfil
- Diseño responsive con breakpoints de Tailwind
- Espaciado inferior (`pb-16`) para evitar superposición

### Consecuencias
✅ Acceso rápido desde cualquier pantalla  
✅ Patrón familiar para usuarios móviles  
✅ Compatible con gestos nativos de iOS/Android  
⚠️ Menos espacio vertical útil

---

## ADR-005: Tipos TypeScript Estrictos (2026-07-28)

### Contexto
Necesitamos prevenir errores y facilitar el mantenimiento a largo plazo.

### Decisión
- `strict: true` en tsconfig.json
- Tipos explícitos para todas las entidades principales
- Archivo centralizado: `src/types/index.ts`
- Exportaciones nombradas

### Consecuencias
✅ Errores detectados en tiempo de compilación  
✅ Mejor autocompletado en IDEs  
✅ Documentación implícita del código  
⚠️ Mayor tiempo inicial de desarrollo  
⚠️ Curva de aprendizaje para TypeScript

---

## ADR-006: PWA con Manifest Básico (2026-07-28)

### Contexto
La aplicación debe poder instalarse como PWA en iOS y Android.

### Decisión
- Manifest.json en `/public`
- Iconos temporales (SVG) de 192x192 y 512x512
- Metadata de PWA en layout raíz
- Service Worker pendiente para versión posterior

### Consecuencias
✅ Instalable en dispositivos móviles  
✅ Icono en pantalla de inicio  
⚠️ Sin funcionalidad offline (próxima iteración)  
⚠️ Iconos temporales deben reemplazarse por PNG reales

---

## ADR-007: Componentes Reutilizables (2026-07-28)

### Contexto
Mantener consistencia visual y reducir duplicación de código.

### Decisión
Estructura de componentes:
```
components/
├── ui/           # Componentes base (Button, Card, LoadingSpinner)
├── layout/       # Estructura (BottomNav, Header)
└── ticket/       # Específicos de dominio (TicketCard, SelectionItem, StatusBadge)
```

### Consecuencias
✅ Reutilización de código  
✅ Consistencia visual  
✅ Facilita cambios globales  
⚠️ Riesgo de sobre-abstracción si se excede

---

## ADR-008: Variables de Entorno (2026-07-28)

### Contexto
Necesitamos manejar credenciales de forma segura.

### Decisión
- `.env.example` con plantilla (commiteado)
- `.env` con datos reales (gitignored)
- Prefijo `NEXT_PUBLIC_` para variables del cliente
- Validación en runtime pendiente

### Consecuencias
✅ Credenciales nunca en el código  
✅ Fácil setup para nuevos desarrolladores  
✅ Compatible con Vercel  
⚠️ Recordar agregar nuevas variables al .example

---

## ADR-009: Mercados Soportados (MVP) (2026-07-28)

### Contexto
Definir qué tipos de apuestas soportaremos inicialmente.

### Decisión
11 mercados iniciales:
- Ganador del partido
- Doble oportunidad
- Más/menos goles
- Ambos equipos marcan
- Hándicap
- Más/menos córners
- Más/menos tarjetas
- Goles de jugador
- Tiros de jugador
- Tiros al arco de jugador
- Atajadas del portero

### Consecuencias
✅ Cobertura de mercados más comunes  
✅ Suficiente para validar la propuesta de valor  
⚠️ Mercados adicionales requieren lógica específica

---

## ADR-010: Sin Integración con Casas de Apuestas (Permanente)

### Contexto
Restricción legal y de diseño del producto.

### Decisión
**NUNCA**:
- Conectar con APIs de casas de apuestas
- Solicitar credenciales de usuarios
- Acceder a cuentas de apuestas
- Realizar apuestas automáticas o manuales

La aplicación es **solo de seguimiento informativo**.

### Consecuencias
✅ Sin riesgos legales  
✅ Sin responsabilidad sobre liquidaciones  
✅ Aplicación más simple y segura  
⚠️ Usuario debe cargar tickets manualmente  
⚠️ Liquidación oficial es responsabilidad de la casa de apuestas

---

## Próximas Decisiones Pendientes

- [ ] **ADR-011:** Estrategia de reconocimiento OCR (proveedor, precisión, costo)
- [ ] **ADR-012:** Estrategia de notificaciones (Web Push vs Supabase Realtime)
- [ ] **ADR-013:** Estrategia de caché y sincronización offline
- [x] **ADR-014:** Estructura de base de datos en Supabase (tablas, RLS, índices) ✅
- [ ] **ADR-015:** Integración con API-Football (endpoints, rate limiting, fallbacks)
- [ ] **ADR-016:** Manejo de estados de error y retry logic

---

## ADR-014: Estructura de Base de Datos en Supabase (2026-07-28)

### Contexto
Necesitamos diseñar el esquema de base de datos que soporte todas las funcionalidades del MVP manteniendo privacidad, escalabilidad y flexibilidad para múltiples proveedores de estadísticas.

### Decisión

#### Tablas de Usuario (con RLS)
1. **profiles:** Información y preferencias del usuario
2. **tickets:** Tickets cargados por el usuario
3. **ticket_files:** Pantallazos y PDFs asociados a tickets
4. **ticket_selections:** Selecciones individuales dentro de cada ticket
5. **selection_progress_snapshots:** Historial de progreso minuto a minuto

#### Catálogos Globales (solo lectura para usuarios)
6. **teams:** Equipos de fútbol normalizados
7. **players:** Jugadores normalizados
8. **football_matches:** Partidos referenciados
9. **markets:** Mercados de apuestas normalizados (11 iniciales)

#### Características clave
- **UUID** como identificadores primarios
- **Row Level Security (RLS)** activado en todas las tablas
- **Campos textuales históricos** además de relaciones normalizadas
  - Ejemplo: `home_team_name` (texto) + `home_team_id` (FK)
  - Razón: Preservar contexto original del ticket incluso si equipos cambian
- **provider_name nullable:** No dependencia de API-Football
- **Storage privado:** Bucket `ticket-uploads` con políticas por usuario
  - Ruta: `{user_id}/{ticket_id}/{filename}`
  - Tipos: JPEG, PNG, WebP, PDF
  - Límite: 10 MiB por archivo
- **Trigger automático:** Crea perfil al registrar usuario en auth.users
- **Función update_updated_at:** Actualiza timestamps automáticamente

#### Estados implementados
- **Tickets:** draft, needs_review, upcoming, live, completed, won, lost, void, archived
- **Selecciones:** upcoming, live_tracking, currently_winning, target_reached, lost, finished, void, needs_review
- **Archivos:** pending, uploaded, processing, processed, failed, deleted
- **Partidos:** scheduled, postponed, cancelled, first_half, halftime, second_half, extra_time, penalties, finished, suspended, unknown

#### Políticas RLS
**Tablas de usuario:**
- SELECT/INSERT/UPDATE/DELETE: Solo datos propios (`auth.uid() = user_id`)
- ticket_files y ticket_selections: Solo si el ticket pertenece al usuario
- selection_progress_snapshots: SELECT permitido, escritura solo desde servidor

**Catálogos:**
- SELECT: Todos los usuarios autenticados
- INSERT/UPDATE/DELETE: Solo procesos internos (no desde navegador)

**Storage:**
- SELECT/INSERT/UPDATE/DELETE: Solo archivos en carpeta propia (`{auth.uid()}/...`)

#### Índices creados
- tickets: user_id, status, created_at
- ticket_files: ticket_id
- ticket_selections: ticket_id, match_id, status
- football_matches: kickoff_at, status
- players: team_id
- selection_progress_snapshots: selection_id, recorded_at

### Consecuencias

#### Ventajas
✅ **Privacidad por diseño:** RLS garantiza aislamiento de datos  
✅ **No pérdida de contexto:** Campos textuales preservan información original  
✅ **Independencia de proveedor:** provider_name nullable permite cambios  
✅ **Escalabilidad:** Separación entre datos de usuario y catálogos globales  
✅ **Trazabilidad:** selection_progress_snapshots guarda historial completo  
✅ **Seguridad:** Storage privado con políticas por usuario  
✅ **Auditoría:** Triggers automáticos para updated_at  
✅ **Normalización opcional:** Permite tickets sin vincular a catálogos  

#### Limitaciones
⚠️ **Todavía sin conexión remota:** Migraciones preparadas pero no ejecutadas  
⚠️ **OCR pendiente:** Campo ocr_raw_text existe pero sin implementación  
⚠️ **Sincronización pendiente:** Estructura lista pero sin proceso automático  
⚠️ **Notificaciones pendientes:** Preferencias almacenadas pero sin triggers  
⚠️ **selection_progress_snapshots no utilizado:** Preparado para futuro  

#### Decisiones pendientes
- **ADR-011:** Proveedor OCR para llenar ticket_files.ocr_raw_text
- **ADR-012:** Estrategia de notificaciones (usar profiles.notification_*)
- **ADR-015:** API de estadísticas definitiva (llenar football_matches, teams, players)
- Estrategia de sincronización en vivo
- Política de retención de archivos con contains_personal_data=true
- Generación automática de tipos TypeScript desde esquema

### Referencias
- [Documentación completa del esquema](../../docs/database-schema.md)
- Migración: `supabase/migrations/20260728000001_initial_ticket_futbol_schema.sql`
- Storage policies: `supabase/migrations/20260728000002_storage_policies.sql`
- Seed: `supabase/seed.sql` (11 mercados iniciales)

---

## Historial de Cambios

| Fecha | ADR | Descripción |
|-------|-----|-------------|
| 2026-07-28 | ADR-001 a ADR-010 | Decisiones iniciales del MVP |
| 2026-07-28 | ADR-014 | Estructura completa de base de datos en Supabase |
