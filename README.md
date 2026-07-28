# ⚽ Ticket Fútbol PWA

Aplicación web progresiva para el seguimiento de tickets de apuestas deportivas de fútbol.

## 🎯 Visión

> "Suba su ticket, vea exactamente cómo avanza cada selección y reciba las alertas que realmente importan."

## ⚠️ Importante

Esta aplicación **NO**:
- Se conecta con casas de apuestas
- Solicita credenciales de casas de apuestas
- Realiza apuestas de ningún tipo
- Maneja dinero

Esta aplicación **SÍ**:
- Permite subir capturas de pantalla de tickets
- Rastrea el progreso de selecciones mediante estadísticas públicas
- Proporciona notificaciones informativas
- Ofrece seguimiento estimado (la liquidación oficial es responsabilidad de la casa de apuestas)

## 🚀 Stack Tecnológico (MVP)

- **Framework:** Next.js 14 con App Router
- **Lenguaje:** TypeScript (strict mode)
- **UI:** React + Tailwind CSS
- **Base de datos:** Supabase (Free tier)
- **Despliegue:** Vercel (Hobby tier)
- **API de estadísticas:** API-Football (Free tier) - próximamente
- **Iconos:** Lucide React

## 📋 Requisitos Previos

- Node.js 18.17 o superior
- npm, yarn o pnpm

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd ticket-futbol-pwa
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita el archivo `.env` con tus credenciales de Supabase (opcional para desarrollo inicial):
   - Ve a [https://app.supabase.com/](https://app.supabase.com/)
   - Crea un nuevo proyecto
   - Copia la URL y la API key desde Project Settings > API

## 🏃 Ejecución

### Modo Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Producción
```bash
npm run build
npm start
```

### Verificación de tipos
```bash
npm run type-check
```

## 📱 Instalación como PWA

### En Android:
1. Abre la aplicación en Chrome
2. Toca el menú (⋮) > "Agregar a pantalla de inicio"
3. La app se instalará como aplicación nativa

### En iOS:
1. Abre la aplicación en Safari
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"

## 🗂️ Estructura del Proyecto

```
ticket-futbol-pwa/
├── src/
│   ├── app/                 # Rutas de Next.js (App Router)
│   │   ├── page.tsx        # Dashboard (inicio)
│   │   ├── upload/         # Subir ticket
│   │   ├── ticket/[id]/    # Detalle del ticket
│   │   ├── history/        # Historial
│   │   └── profile/        # Perfil
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/         # Navegación y estructura
│   │   ├── ticket/         # Componentes de tickets
│   │   └── ui/             # Componentes UI base
│   ├── lib/                 # Utilidades y configuración
│   │   ├── supabase.ts     # Cliente de Supabase
│   │   └── mock-data.ts    # Datos simulados (temporal)
│   └── types/              # Tipos TypeScript
│       └── index.ts
├── public/                  # Archivos estáticos
│   ├── manifest.json       # Manifest PWA
│   └── icons/              # Iconos de la app
└── .github/
    └── agents/             # Agente personalizado de Copilot
```

## 🎨 Pantallas Disponibles

1. **Dashboard (/)** - Resumen de tickets activos
2. **Subir Ticket (/upload)** - Cargar captura de pantalla
3. **Detalle (/ticket/[id])** - Progreso de selecciones
4. **Historial (/history)** - Tickets anteriores
5. **Perfil (/profile)** - Configuración del usuario

## 📊 Estados de Selección

| Estado | Descripción |
|--------|-------------|
| `upcoming` | Próxima — el partido no ha comenzado |
| `live_tracking` | En juego — el partido está en curso |
| `currently_winning` | Se está cumpliendo — va por buen camino |
| `target_reached` | Objetivo alcanzado — estadística cumplida |
| `lost` | Perdida — la selección falló |
| `finished` | Finalizada — liquidación confirmada |
| `void` | Anulada — selección cancelada |
| `needs_review` | Requiere revisión — datos inconsistentes |

## 🔐 Seguridad

- Las variables de entorno nunca se commitean (ver `.gitignore`)
- Siempre usa `.env.example` como plantilla
- Los datos de usuarios están protegidos con Row Level Security en Supabase
- Las validaciones se ejecutan en el servidor

## 🚧 Estado Actual (MVP - Versión 0.1.0)

### ✅ Implementado
- Estructura de Next.js con App Router
- Diseño mobile-first con Tailwind CSS
- Navegación inferior con 4 secciones
- Pantallas con datos simulados
- Tipos TypeScript completos
- Componentes reutilizables
- Preparación para PWA

### 🔄 Próximos Pasos
- Integración real con Supabase
- Autenticación de usuarios
- Reconocimiento OCR de capturas
- Integración con API-Football
- Notificaciones push
- Sistema de seguimiento en vivo

### 💡 Versiones Futuras
- Live Match Tracker con cancha animada
- Soporte de archivos PDF
- Gamificación responsable
- Compartir tickets
- Soporte multi-deporte

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

## 🤝 Contribución

Este proyecto está en desarrollo activo. Para contribuir, consulta las guías en `.github/`.

## 📞 Soporte

Para preguntas o problemas, abre un issue en el repositorio.

---

**Recuerda:** Esta aplicación proporciona seguimiento informativo. La liquidación oficial de los tickets siempre corresponde a la casa de apuestas.
