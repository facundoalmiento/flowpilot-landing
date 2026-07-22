# Morga

Morga es una web app personal para organizar proyectos, tareas, foco semanal y decisiones inmediatas con una interfaz responsive pensada para escritorio y celular.

## Qué se implementó en esta etapa

- Migración desde la landing estática a React + Vite + TypeScript.
- TailwindCSS y React Router.
- Respaldo de la versión anterior en `legacy-landing/`.
- Layout responsive con sidebar de escritorio y navegación inferior móvil.
- Dashboard inicial calculado desde datos reales guardados.
- Modelo de datos de proyectos y tareas.
- Datos mock realistas.
- Página de proyectos con:
  - creación,
  - edición,
  - eliminación con confirmación,
  - búsqueda,
  - filtros,
  - ordenamiento.
- Persistencia temporal con `localStorage`.
- Estados vacíos y validaciones básicas.

## Stack

- React 18
- Vite
- TypeScript
- TailwindCSS
- React Router

## Estructura principal

```text
src/
├── app/
├── components/
│   ├── brand/
│   ├── projects/
│   └── ui/
├── data/
│   └── mock/
├── features/
│   ├── dashboard/
│   ├── navigation/
│   ├── planning/
│   └── projects/
├── layouts/
├── pages/
├── services/
│   └── storage/
├── styles/
├── types/
└── utils/
```

## Cómo ejecutar

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar el entorno de desarrollo:

```bash
npm run dev
```

3. Crear build de producción:

```bash
npm run build
```

4. Ejecutar lint:

```bash
npm run lint
```

## Cómo probar las funciones

### Dashboard

- Abrí la app en `/`.
- Verificá que:
  - las prioridades salgan de tareas pendientes,
  - los vencimientos salgan de tareas y proyectos,
  - el dinero disponible estimado use `settings` + costos de tareas,
  - las alertas cambien según fechas, bloqueos y costos.

### CRUD de proyectos

- Entrá a `/projects`.
- Creá un proyecto nuevo.
- Editalo.
- Eliminá uno con confirmación.
- Recargá la página y comprobá que siga guardado.

### Filtros

- Probá búsqueda por nombre, descripción y próxima acción.
- Filtrá por categoría, prioridad y estado.
- Probá ordenar por actualización, fecha, prioridad, nombre y avance.

### Responsive

- Revisá en 360 px, 390 px, 768 px, 1024 px, 1440 px y 1920 px.
- En escritorio debe verse sidebar lateral.
- En móvil debe verse navegación inferior.

## Persistencia

La app usa `localStorage` con la clave:

```text
morga-planning-store-v1
```

Si querés resetear el estado, podés borrar esa clave desde el navegador.

## Legado preservado

La landing previa quedó guardada en:

```text
legacy-landing/
```

## Limitaciones actuales

- No hay backend ni Supabase.
- No hay autenticación.
- No hay módulo financiero completo todavía.
- No hay CRUD visual de tareas independiente.
- No hay decisiones de compra implementadas como módulo propio.
- El manifest PWA es básico y no incluye instalación avanzada ni service worker.

## Próxima etapa sugerida

- Página completa de tareas.
- Módulo de decisiones de compra con reglas determinísticas.
- Finanzas básicas reales con métricas reutilizables.
- Mejoras de accesibilidad y atajos de teclado.
- PWA más completa.
