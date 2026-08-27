4. Inicio de sesión

En la página pública existirá un botón:

Iniciar sesión

El usuario será enviado al sistema privado.

Los roles principales serán:

DIRECTORA
MAESTRA
PADRE

La autenticación se realizará mediante Supabase Auth.

5. Funciones por rol
Padre

Podrá consultar:

Sus hijos.
Curso actual.
Asistencia.
Actividades.
Comunicados.
Observaciones permitidas.
Información histórica.
Documentos permitidos.

No podrá consultar información de otros niños.

Maestra

Podrá:

Consultar sus cursos.
Consultar estudiantes asignados.
Registrar asistencia.
Crear actividades.
Registrar observaciones permitidas.
Publicar comunicados según permisos.
Consultar información necesaria de sus estudiantes.
Directora

Tendrá funciones administrativas:

Gestionar padres.
Gestionar niños.
Gestionar maestras.
Gestionar cursos.
Gestionar niveles.
Gestionar paralelos.
Gestionar periodos académicos.
Gestionar matrículas.
Promover estudiantes.
Registrar graduaciones.
Registrar retiros.
Administrar cursos vacacionales.
Consultar reportes.
Administrar configuración.
Consultar auditoría.
6. Modelo académico

No se debe almacenar únicamente el curso actual del niño.

No utilizar únicamente algo como:

student.course = "Inicial 2"

porque esto elimina el historial.

Se utilizará un sistema de matrículas.

Ejemplo:

Mateo

2025-2026 → Inicial 1
2026-2027 → Inicial 2
2027-2028 → Primer Grado

Cada matrícula tendrá relación con:

student
academic_period
course
status
enrollment_date
withdrawal_date
7. Niveles académicos

La guardería podrá manejar:

Inicial 1
Inicial 2
Primer Grado

Estos valores deberán ser configurables y no estar escritos directamente en el código.

8. Cursos y paralelos

Un nivel podrá tener varios paralelos.

Ejemplo:

Inicial 2
├── A
└── B

Primer Grado
├── A
└── B

Un curso estará relacionado con:

Periodo académico.
Nivel.
Paralelo.
Maestra.
Capacidad.
Estado.
9. Periodos académicos

Se manejarán periodos como:

2025-2026
2026-2027
2027-2028

Estados:

PLANNING
ACTIVE
CLOSED
ARCHIVED

La información de periodos anteriores no se elimina.

10. Estado de los estudiantes

Los estudiantes podrán tener estados:

ACTIVE
PROMOTED
GRADUATED
WITHDRAWN
ARCHIVED

Si continúa en la institución:

Inicial 1
    ↓
Inicial 2
    ↓
Primer Grado

Si termina su etapa:

GRADUATED

Si abandona durante el periodo:

WITHDRAWN

El historial siempre debe conservarse.

11. Estado de los padres

Un padre puede tener varios hijos.

Ejemplo:

Padre
├── Hijo A → GRADUATED
└── Hijo B → ACTIVE

El padre seguirá activo porque tiene un hijo matriculado.

Regla:

¿Tiene al menos un hijo activo?

Sí  → PADRE ACTIVE
No  → PADRE INACTIVE

No se deben eliminar las cuentas de los padres automáticamente.

12. Después de graduarse

Cuando un niño termine Inicial, se conserva su información.

Por ejemplo:

Mateo
├── 2025-2026 → Inicial 1
├── 2026-2027 → Inicial 2
└── 2027-2028 → Primer Grado

Si el niño abandona la institución:

GRADUATED

o:

WITHDRAWN

Su historial permanece disponible según los permisos correspondientes.

13. Vacaciones

Existirá un modo de vacaciones.

Durante vacaciones la página pública seguirá funcionando.

Podrá mostrar:

Estamos en periodo de vacaciones.

Conoce nuestros cursos vacacionales.

[ Cursos vacacionales ]
[ Contactar a la directora ]

La directora podrá preparar el siguiente periodo académico.

Durante vacaciones podrá:

Crear el nuevo periodo.
Crear cursos.
Asignar maestras.
Preparar matrículas.
Configurar información.
Preparar comunicados.
14. Cursos vacacionales

La página pública podrá mostrar:

Nombre del curso.
Descripción.
Fechas.
Horarios.
Edades.
Cupos.
Información de contacto.

Esto permitirá que la guardería siga utilizando la página aunque no exista actividad académica normal.

15. Backend

Se utilizará Supabase como backend principal.

Servicios utilizados:

Supabase Auth
PostgreSQL
Supabase Storage
Row Level Security
Edge Functions si son necesarias
16. Base de datos

La base de datos será PostgreSQL.

Entidades principales:

profiles
parents
students
teachers
directors
academic_periods
academic_levels
courses
enrollments
attendance
activities
announcements
observations
authorizations
files
audit_logs
system_settings

La estructura definitiva podrá modificarse durante el análisis y desarrollo.

17. Seguridad

Se utilizará Row Level Security (RLS).

La seguridad no debe depender únicamente del frontend.

Ejemplo:

PADRE
→ solamente sus hijos

MAESTRA
→ solamente sus cursos y estudiantes autorizados

DIRECTORA
→ administración general

Se deberán realizar pruebas intentando acceder a información no autorizada.

18. Frontend

Tecnologías:

React
TypeScript
Vite
Tailwind CSS

El frontend será responsive.

Debe funcionar correctamente en:

Computadora.
Tablet.
Teléfono.
19. PWA

El sistema será desarrollado como Progressive Web App.

Permitirá:

Agregar a pantalla de inicio

sin necesidad de desarrollar aplicaciones Android e iOS independientes inicialmente.

Tecnologías relacionadas:

Service Worker
Web App Manifest
IndexedDB
Cache
20. Modo offline / degradado

Se quiere que el frontend continúe funcionando parcialmente cuando el backend falle.

Ejemplo:

Frontend       OK
Backend        CAÍDO

El usuario podrá seguir viendo ciertos datos previamente almacenados.

Se mostrará:

⚠️ Mostrando información almacenada.

Última sincronización:
24/08/2026 17:42
21. Datos almacenados localmente

Se utilizará IndexedDB para guardar información necesaria para lectura temporal.

Por ejemplo:

Perfil.
Hijos.
Información básica.
Asistencias anteriores.
Actividades.
Comunicados.
Fecha de última sincronización.

No se debe almacenar innecesariamente información sensible de menores.

Al cerrar sesión se deberá limpiar la información privada local.

22. Regla durante una caída

Inicialmente:

LECTURA OFFLINE      ✅
ESCRITURA OFFLINE    ❌

Si el backend está caído:

Permitido:

Consultar información almacenada.
Consultar historial.
Consultar actividades anteriores.
Consultar comunicados anteriores.

No permitido:

Crear asistencia.
Modificar datos.
Subir archivos.
Crear actividades.
Realizar operaciones que requieran sincronización.

Posteriormente se podría implementar una cola de sincronización offline.

23. Estado del sistema

Se implementarán estados globales:

OPERATIONAL
DEGRADED
MAINTENANCE
BACKEND_DOWN
DATABASE_DOWN
RESTORING

Ejemplos:

🟢 Sistema funcionando normalmente.

🟡 Algunas funciones están temporalmente limitadas.

🟠 Sistema en mantenimiento.

🔴 No podemos conectarnos temporalmente con el servidor.

🔵 Estamos restaurando el servicio.
24. Cloudflare

Se utilizará Cloudflare para infraestructura pública.

Componentes previstos:

Cloudflare Pages
Cloudflare Workers
Cloudflare KV
Cloudflare Cron

Cloudflare Pages alojará el frontend.

Cloudflare Workers manejará funciones auxiliares.

Cloudflare KV podrá almacenar el estado global del sistema.

Cloudflare Cron permitirá ejecutar tareas programadas.

25. Health checks

Se implementará:

/api/health
/api/status

El frontend podrá comprobar si los servicios están disponibles.

Se busca distinguir entre:

Sin internet del usuario
Backend caído
Base de datos caída
Mantenimiento
26. Backups

Los backups son obligatorios.

Se utilizará PostgreSQL con pg_dump.

Se contemplan:

Backup semanal
Backup de cierre de periodo
Backup antes de migraciones importantes
Backup antes del inicio de un nuevo periodo

Los backups deberán cifrarse.

27. Restauración

No solamente se crearán backups.

También se probará periódicamente su restauración.

Proceso:

Backup
  ↓
Restauración en entorno temporal
  ↓
Validación
  ↓
Resultado

La finalidad es comprobar que los backups realmente son utilizables.

28. Git y GitHub

El código se gestionará con Git y GitHub.

Ramas:

main
develop
feature/*
fix/*

Flujo:

feature/*
    ↓
develop
    ↓
Pull Request
    ↓
main
    ↓
Producción

No se debe trabajar directamente sobre main.

29. CI/CD

El pipeline recomendado:

Push
 ↓
Lint
 ↓
Typecheck
 ↓
Tests
 ↓
Build
 ↓
Deploy

El despliegue automático se realizará después de pasar las validaciones.

30. Ambientes

Se utilizarán como mínimo:

LOCAL
DEVELOPMENT
PRODUCTION

No se debe desarrollar directamente en producción.

Idealmente se utilizarán proyectos/base de datos separados para desarrollo y producción.

31. Testing

Se realizarán:

Pruebas unitarias
Pruebas de integración
Pruebas E2E
Pruebas de seguridad
Pruebas responsive
Pruebas offline
Pruebas de recuperación
32. Casos críticos de prueba

Se debe probar:

Padre intentando ver otro niño
Maestra intentando acceder a otro curso
Usuario inactivo intentando entrar
Acceso directo a rutas privadas
Cambio de rol
Creación de matrícula
Promoción
Graduación
Retiro
Caída del backend
Caída de internet
Modo mantenimiento
Restauración de backup
33. Auditoría

Se registrarán operaciones importantes:

user_id
action
resource
resource_id
timestamp
metadata

Especialmente:

Cambios de roles.
Matrículas.
Retiros.
Graduaciones.
Cambios de asistencia.
Cambios administrativos.
34. Equipo de desarrollo

El equipo será de 5 desarrolladores.

Dev 1 — Líder técnico / Full Stack

Responsabilidades:

Arquitectura.
Integración.
Estándares.
Code review.
Decisiones técnicas.
Apoyo backend.
Apoyo infraestructura.
Dev 2 — Frontend público / UX

Responsabilidades:

Página institucional.
Diseño visual.
Tailwind.
Responsive.
Accesibilidad.
Cursos vacacionales.
Contacto.
Experiencia de usuario.
Dev 3 — Frontend privado / PWA

Responsabilidades:

Dashboard de padre.
Dashboard de maestra.
Dashboard de directora.
Rutas privadas.
PWA.
Service Worker.
IndexedDB.
Modo offline/degradado.
Dev 4 — Backend / Datos

Responsabilidades:

PostgreSQL.
Supabase.
Modelo de datos.
Migraciones.
Auth.
RLS.
Storage.
Reglas de negocio.
Matrículas.
Periodos.
Asistencia.
Dev 5 — DevOps / QA / Seguridad

Responsabilidades:

Cloudflare.
Workers.
KV.
Cron.
CI/CD.
Backups.
Restauración.
Pruebas E2E.
Seguridad.
Monitoreo.
Auditoría.
35. Uso de Inteligencia Artificial

Se utilizarán herramientas de IA como apoyo al equipo.

La IA podrá ayudar con:

Generación de código.
Componentes.
SQL.
Tests.
Documentación.
Refactorización.
Debugging.
Revisión de código.
Scripts.
CI/CD.
Generación de casos de prueba.

La IA no reemplazará la revisión humana.

Especialmente deberán revisarse manualmente:

RLS
Autenticación
Datos de menores
Permisos
Migraciones
Backups
Restauraciones
Seguridad
36. Tiempo estimado

Con 5 desarrolladores trabajando en paralelo y utilizando IA como herramienta de apoyo:

Estimación:
10–12 semanas

Una estimación razonable para producción es aproximadamente:

3 meses

No se considera recomendable prometer una entrega extremadamente corta porque el sistema manejará información sensible y requiere pruebas.

37. Horas estimadas

Para 5 desarrolladores:

6 horas productivas por día
6 h × 5 desarrolladores × 5 días × 12 semanas

= 1.800 horas-persona
8 horas productivas por día
8 h × 5 desarrolladores × 5 días × 12 semanas

= 2.400 horas-persona

Estimación recomendada para planificación:

≈ 2.000–2.200 horas-persona

Incluyendo:

Desarrollo.
Integración.
Testing.
Seguridad.
DevOps.
Documentación.
Correcciones.
Despliegue.
38. Cronograma aproximado
Semanas 1–2

Base técnica:

GitHub
React
TypeScript
Vite
Tailwind
Supabase
PostgreSQL
Auth
RLS
Ambientes
Semanas 3–4

Núcleo académico:

Padres
Niños
Maestras
Directoras
Periodos
Niveles
Cursos
Paralelos
Semanas 5–6

Matrículas:

Matrículas
Promoción
Graduación
Retiros
Estados
Historial
Semanas 7–8

Operación diaria:

Asistencia
Actividades
Comunicados
Observaciones
Archivos
Auditoría
Semanas 9–10

Infraestructura avanzada:

PWA
Service Worker
IndexedDB
Offline
Modo degradado
Cloudflare Worker
Health checks
Estado del sistema
Semanas 11–12

QA y producción:

Testing
Seguridad
Pruebas E2E
Pruebas offline
Pruebas de caída
Backups
Restore
Performance
Correcciones
Deploy
39. MVP

El primer MVP debe priorizar:

Login
Roles
Padres
Niños
Maestras
Directoras
Periodos
Cursos
Matrículas
Asistencia
Actividades
Comunicados

Después se incorporarán las funciones más avanzadas:

PWA
Offline
IndexedDB
Health checks
Cloudflare KV
Backups automatizados
Restauración
Auditoría avanzada
40. Principios del proyecto

El sistema debe seguir estos principios:

No borrar información histórica innecesariamente.
No depender de una sola persona del equipo.
No confiar únicamente en la seguridad del frontend.
Utilizar RLS para proteger la información.
Tener backups verificables.
Separar desarrollo y producción.
Probar restauraciones.
Diseñar pensando en dispositivos móviles.
Mantener la página pública independiente del backend.
Mostrar información anterior cuando sea seguro hacerlo.
No permitir modificaciones offline inicialmente.
Mantener el sistema sencillo mientras tenga menos de 100 usuarios.
Dejar la arquitectura preparada para crecer.
Utilizar IA como apoyo, pero mantener revisión humana.
41. Arquitectura resumida
                         USUARIOS
                            │
             ┌──────────────┴──────────────┐
             │                             │
          Público                       Usuarios
             │                             │
             ▼                             ▼
     Cloudflare Pages                React / PWA
             │                             │
             │                    ┌────────┴────────┐
             │                    │                 │
             │                  Online          Offline
             │                    │                 │
             │                    ▼                 ▼
             │                Supabase          IndexedDB
             │                    │
             │          ┌─────────┼─────────┐
             │          │         │         │
             │       Auth     PostgreSQL  Storage
             │                    │
             │                   RLS
             │
             └────────────────────┐
                                  │
                         Cloudflare Worker
                                  │
                         ┌────────┴────────┐
                         │                 │
                       KV                Cron
                         │                 │
                         └────────┬────────┘
                                  │
                              Monitoreo

GitHub
  │
  ├── Código
  ├── Pull Requests
  ├── CI/CD
  └── Backups
42. Estado actual de la planificación

El proyecto se encuentra en etapa de planificación tecnológica y organizativa.

Ya se han definido conceptualmente:

Tipo de sistema.
Cantidad aproximada de usuarios.
Arquitectura Full Stack.
Tecnologías principales.
Modelo académico.
Roles.
Manejo de vacaciones.
Manejo de graduaciones.
Manejo de retiros.
Estados de padres y estudiantes.
Modo offline.
Modo degradado.
Health checks.
Backups.
Restauración.
PWA.
Infraestructura.
Equipo de 5 desarrolladores.
Distribución de responsabilidades.
Estimación de 10–12 semanas.
Estimación de aproximadamente 2.000–2.200 horas-persona.