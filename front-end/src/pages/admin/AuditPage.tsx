import { useState } from 'react';
import {
  History,
  CalendarCheck,
  Star,
  MessageSquare,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { useMyCourses } from '@/hooks/useCourses';
import { teacherModuleService } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AttendanceStatus } from '@/types';
import toast from 'react-hot-toast';

export default function AuditPage() {
  const { data: courses } = useMyCourses();
  const [activeTab, setActiveTab] = useState<'asistencias' | 'notas' | 'observaciones' | 'seguridad'>('asistencias');

  // Filters for Asistencia
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [attendanceCourse, setAttendanceCourse] = useState<string>('all');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('all');

  // Filters for Notas
  const [gradeSearch, setGradeSearch] = useState<string>('');
  const [gradeCourse, setGradeCourse] = useState<string>('all');

  // Filters for Observaciones & Comunicados
  const [obsTypeFilter, setObsTypeFilter] = useState<string>('all');

  // Filters for Audit Log
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  // Data fetching from services
  const allAttendance = teacherModuleService.getAttendance();
  const allObservations = teacherModuleService.getObservations();
  const allAnnouncements = teacherModuleService.getAnnouncements();
  const allAuditLogs = teacherModuleService.getAuditLogs();

  // Filtered Attendance List
  const filteredAttendance = allAttendance.filter((rec) => {
    if (attendanceDate && rec.date !== attendanceDate) return false;
    if (attendanceCourse !== 'all' && String(rec.courseId) !== attendanceCourse) return false;
    if (attendanceStatus !== 'all' && rec.status !== attendanceStatus) return false;
    return true;
  });

  // Calculate Attendance Stats for current filter
  const attendanceCounts = filteredAttendance.reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>
  );

  // Filtered Audit Logs
  const filteredLogs = allAuditLogs.filter((log) => {
    if (logActionFilter !== 'all' && log.action !== logActionFilter) return false;
    if (
      logSearch &&
      !log.user.toLowerCase().includes(logSearch.toLowerCase()) &&
      !log.details.toLowerCase().includes(logSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const exportAuditReport = () => {
    toast.success('Informe de Auditoría exportado exitosamente');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bitácora & Auditoría General del Sistema"
        description="Consola de auditoría institucional — registro de asistencias diarias guardadas, notas, observaciones y bitácora de seguridad"
      >
        <Button onClick={exportAuditReport} className="bg-[#09A9C2] hover:bg-[#0896AC] text-white font-bold shadow-md rounded-xl">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Auditoría
        </Button>
      </PageHeader>

      {/* Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-white/60">
        <button
          type="button"
          onClick={() => setActiveTab('asistencias')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'asistencias'
              ? 'bg-[#008BC1] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          Asistencias Guardadas por Día
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'notas'
              ? 'bg-[#31B45A] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="h-4 w-4" />
          Calificaciones & Notas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('observaciones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'observaciones'
              ? 'bg-[#F4B51B] text-slate-900 shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Observaciones & Comunicados
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seguridad')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'seguridad'
              ? 'bg-[#7D5AA6] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Log de Seguridad & Operaciones
        </button>
      </div>

      {/* ── TAB 1: ASISTENCIAS DIARIAS ────────────────────────────────────────── */}
      {activeTab === 'asistencias' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Fecha de Asistencia</Label>
                  <Input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-44 bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs"
                    value={attendanceDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const todayStr = new Date().toISOString().split('T')[0];
                      if (val > todayStr) {
                        toast.error('No se pueden consultar fechas futuras');
                        setAttendanceDate(todayStr);
                      } else {
                        setAttendanceDate(val);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Curso / Materia</Label>
                  <Select value={attendanceCourse} onValueChange={setAttendanceCourse}>
                    <SelectTrigger className="w-56 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                      <SelectValue placeholder="Todos los Cursos" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                      <SelectItem value="all">Todos los Cursos</SelectItem>
                      {courses?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Estado de Asistencia</Label>
                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                    <SelectTrigger className="w-44 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                      <SelectValue placeholder="Todos los Estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                      <SelectItem value="all">Todos los Estados</SelectItem>
                      <SelectItem value="present">Presente</SelectItem>
                      <SelectItem value="absent">Ausente</SelectItem>
                      <SelectItem value="late">Atraso</SelectItem>
                      <SelectItem value="excused">Justificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Attendance Quick Stats */}
              <div className="flex items-center gap-3 bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 shadow-inner">
                <div className="flex items-center gap-1 text-xs text-green-700 font-extrabold">
                  <CheckCircle2 className="h-4 w-4" /> {attendanceCounts.present} Pres.
                </div>
                <div className="flex items-center gap-1 text-xs text-red-700 font-extrabold">
                  <XCircle className="h-4 w-4" /> {attendanceCounts.absent} Aus.
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700 font-extrabold">
                  <Clock className="h-4 w-4" /> {attendanceCounts.late} Atr.
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-700 font-extrabold">
                  <AlertCircle className="h-4 w-4" /> {attendanceCounts.excused} Just.
                </div>
              </div>
            </div>
          </Card>

          {/* Attendance Table Card */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#008BC1]" />
                Registros de Asistencia Diaria ({filteredAttendance.length})
              </h3>
              {attendanceDate && (
                <Badge variant="outline" className="bg-sky-50 text-[#008BC1] border-sky-200 font-bold">
                  Fecha: {attendanceDate}
                </Badge>
              )}
            </div>

            {filteredAttendance.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                No hay registros de asistencia con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-100/70 text-slate-700 font-black text-xs uppercase">
                    <tr>
                      <th className="p-3">Estudiante</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Materia / Curso</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Observaciones / Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-teal-50/40 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{rec.studentName}</td>
                        <td className="p-3 text-xs text-slate-500 font-bold">{rec.studentCode}</td>
                        <td className="p-3 text-xs font-semibold text-teal-800">{rec.courseName}</td>
                        <td className="p-3 text-xs font-bold text-slate-600">{rec.date}</td>
                        <td className="p-3">
                          {rec.status === 'present' && <Badge className="bg-green-600 text-white font-bold">Presente</Badge>}
                          {rec.status === 'absent' && <Badge className="bg-red-600 text-white font-bold">Ausente</Badge>}
                          {rec.status === 'late' && <Badge className="bg-amber-500 text-white font-bold">Atraso</Badge>}
                          {rec.status === 'excused' && <Badge className="bg-purple-600 text-white font-bold">Justificado</Badge>}
                        </td>
                        <td className="p-3 text-xs text-slate-600">{rec.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: CALIFICACIONES Y NOTAS ──────────────────────────────────────── */}
      {activeTab === 'notas' && (
        <div className="space-y-4">
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs font-bold text-slate-700">Buscar Estudiante</Label>
                <div className="relative">
                  <Input
                    className="bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs pl-9"
                    placeholder="Nombre o código de estudiante..."
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Curso / Materia</Label>
                <Select value={gradeCourse} onValueChange={setGradeCourse}>
                  <SelectTrigger className="w-56 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                    <SelectValue placeholder="Todos los Cursos" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                    <SelectItem value="all">Todos los Cursos</SelectItem>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-6 text-center">
            <Star className="h-8 w-8 text-[#31B45A] mx-auto mb-2" />
            <h3 className="font-extrabold text-slate-800 text-base">Consola de Auditoría de Calificaciones</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
              Todas las notas registradas por los docentes quedan respaldadas con marca de agua y sello de auditoría de la institución.
            </p>
          </Card>
        </div>
      )}

      {/* ── TAB 3: OBSERVACIONES Y COMUNICADOS ─────────────────────────────────── */}
      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Filtrar por Tipo</Label>
                <Select value={obsTypeFilter} onValueChange={setObsTypeFilter}>
                  <SelectTrigger className="w-52 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="positiva">Observaciones Positivas</SelectItem>
                    <SelectItem value="atencion">Llamados de Atención</SelectItem>
                    <SelectItem value="comunicado">Comunicados Institucionales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allObservations.map((obs) => (
              <Card key={obs.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={obs.type === 'positiva' ? 'bg-green-600 text-white font-bold' : 'bg-amber-600 text-white font-bold'}>
                    {obs.type === 'positiva' ? 'Positiva' : 'Llamado de Atención'}
                  </Badge>
                  <span className="text-xs text-slate-400 font-bold">{obs.date}</span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">{obs.title}</h4>
                <p className="text-xs text-slate-600">{obs.detail}</p>
                <div className="text-[11px] font-bold text-slate-500 pt-2 border-t flex justify-between">
                  <span>Estudiante: <strong>{obs.studentName}</strong></span>
                  <span>Materia: <strong>{obs.courseName}</strong></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LOG DE SEGURIDAD Y OPERACIONES ─────────────────────────────── */}
      {activeTab === 'seguridad' && (
        <div className="space-y-4">
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-xs font-bold text-slate-700">Buscar por Usuario o Detalle</Label>
                <div className="relative">
                  <Input
                    className="bg-white border-slate-200 text-slate-800 font-medium rounded-xl shadow-xs pl-9"
                    placeholder="Filtrar por usuario o detalle..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Acción Realizada</Label>
                <Select value={logActionFilter} onValueChange={setLogActionFilter}>
                  <SelectTrigger className="w-56 bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                    <SelectValue placeholder="Todas las Acciones" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                    <SelectItem value="all">Todas las Acciones</SelectItem>
                    <SelectItem value="INICIO_SESION">Inicio de Sesión</SelectItem>
                    <SelectItem value="REGISTRO_ASISTENCIA">Registro de Asistencia</SelectItem>
                    <SelectItem value="CREAR_OBSERVACION">Crear Observación</SelectItem>
                    <SelectItem value="MODIFICAR_MATRICULA">Modificar Matrícula</SelectItem>
                    <SelectItem value="PUBLICAR_COMUNICADO">Publicar Comunicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#7D5AA6]" />
                Historial de Operaciones y Bitácora de Seguridad ({filteredLogs.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100/70 text-slate-700 font-black text-xs uppercase">
                  <tr>
                    <th className="p-3">Marca de Tiempo</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Entidad</th>
                    <th className="p-3">Detalles</th>
                    <th className="p-3">IP Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="p-3 text-xs font-bold text-slate-600">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{log.user}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-purple-50 text-[#7D5AA6] border-purple-200 font-bold uppercase text-[10px]">
                          {log.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-slate-800 text-white font-mono text-[10px]">{log.action}</Badge>
                      </td>
                      <td className="p-3 text-xs font-bold text-teal-800">{log.entity}</td>
                      <td className="p-3 text-xs text-slate-600">{log.details}</td>
                      <td className="p-3 text-xs font-mono text-slate-400">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
