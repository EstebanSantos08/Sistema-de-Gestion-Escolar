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

## Despliegue recomendado

Frontend en Vercel:

1. Importa la carpeta `front-end/` como proyecto en Vercel.
2. Define `VITE_API_URL` apuntando a la URL pública del backend en Render.
3. Mantén el `vercel.json` para que React Router funcione en rutas internas.

Backend en Render:

1. Crea una PostgreSQL en Render.
2. Despliega la carpeta `back-end/` como Web Service.
3. Usa `DATABASE_URL` desde la base de datos de Render.
4. Define `CORS_ORIGIN` con la URL final del frontend de Vercel.
5. Si necesitas varios orígenes, sepáralos con coma en `CORS_ORIGIN`.

Base de datos:

- Recomendación: PostgreSQL en Render para este proyecto.
- No uses SQLite en producción porque Render reinicia el filesystem y puedes perder datos.

## Notas

- El backend usa SQLite local.
- No subas archivos `.env` ni bases de datos generadas.
