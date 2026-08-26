# Sistema de Gestión Escolar

Sistema web para administrar matrículas, calificaciones, reportes y autenticación por roles en un entorno local.

## Inicio rápido

1. Instala dependencias en `back-end/` y `front-end/`.
2. Configura los archivos `.env` de ambas carpetas.
3. Ejecuta el seed del backend para cargar datos de prueba.
4. Levanta el backend y luego el frontend.

Backend por defecto: `http://localhost:3001`

Frontend por defecto: `http://localhost:5173`

## Funcionalidades

- Gestión de usuarios con roles de administrador, docente y estudiante.
- Matrículas por período académico.
- Registro y edición de calificaciones con ponderación.
- Reportes en Excel y PDF.
- Paneles separados por rol.

## Estructura

- `back-end/`: API en Node.js, TypeScript, Express y SQLite.
- `front-end/`: interfaz en React, TypeScript y Vite.

## Requisitos

- Node.js 20 o superior.
- npm.

## Instalación

```powershell
cd "C:\Users\User\Desktop\PROYECTOS PERSONALES\PROYECTO PLATAFORMA ESCOLAR\back-end"
npm install

cd ..\front-end
npm install
```

## Ejecución en desarrollo

Backend:

```powershell
cd "C:\Users\User\Desktop\PROYECTOS PERSONALES\PROYECTO PLATAFORMA ESCOLAR\back-end"
npm run dev
```

Frontend:

```powershell
cd "C:\Users\User\Desktop\PROYECTOS PERSONALES\PROYECTO PLATAFORMA ESCOLAR\front-end"
npm run dev
```

## Scripts útiles

Backend:

```powershell
npm run build
npm run seed
```

Frontend:

```powershell
npm run build
npm run preview
```

## Variables de entorno

Configura los archivos `.env` dentro de cada carpeta antes de ejecutar el proyecto.

## Credenciales de prueba

- Administrador: admin@escuela.com / Admin123!
- Docente: garcia@escuela.com / Docente123!
- Docente: martinez@escuela.com / Docente123!
- Estudiante: juan@escuela.com / Alumno123!
- Estudiante: maria@escuela.com / Alumno123!
- Estudiante: pedro@escuela.com / Alumno123!

## Flujo para subir cambios a GitHub

```powershell
cd "C:\Users\User\Desktop\PROYECTOS PERSONALES\PROYECTO PLATAFORMA ESCOLAR"
git status
git add .
git commit -m "Describe tus cambios"
git push
```

## Notas

- El backend usa SQLite local.
- No subas archivos `.env` ni bases de datos generadas.
