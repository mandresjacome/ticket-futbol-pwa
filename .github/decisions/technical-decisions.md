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
- [ ] **ADR-014:** Estructura de base de datos en Supabase (tablas, RLS, índices)
- [ ] **ADR-015:** Integración con API-Football (endpoints, rate limiting, fallbacks)
- [ ] **ADR-016:** Manejo de estados de error y retry logic

---

## Historial de Cambios

| Fecha | ADR | Descripción |
|-------|-----|-------------|
| 2026-07-28 | ADR-001 a ADR-010 | Decisiones iniciales del MVP |
