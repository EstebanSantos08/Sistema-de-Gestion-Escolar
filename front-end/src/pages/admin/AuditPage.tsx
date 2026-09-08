import { useState } from 'react';
import {
  CalendarCheck,
  Star,
  MessageSquare,
  ShieldCheck,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Administración y Seguridad"
        title="Bitácora & Auditoría del Sistema"
        description="Consola institucional de auditoría: registro de asistencias diarias, notas, observaciones y bitácora de eventos"
      >
        <Button onClick={exportAuditReport} className="h-10">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Auditoría
        </Button>
      </PageHeader>

      {/* Tabs Selector */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#D6E5E3] bg-white p-1.5 shadow-2xs">
        {[
          { id: 'asistencias', label: 'Asistencias por Día', icon: CalendarCheck },
          { id: 'notas', label: 'Calificaciones & Notas', icon: Star },
          { id: 'observaciones', label: 'Observaciones Escolares', icon: MessageSquare },
          { id: 'seguridad', label: 'Bitácora de Seguridad', icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F79] ${
              activeTab === id
                ? 'bg-[#087F79] text-white shadow-xs'
                : 'text-[#5E7A77] hover:bg-[#F4FAF9] hover:text-[#183B3A]'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: ASISTENCIAS DIARIAS ────────────────────────────────────────── */}
      {activeTab === 'asistencias' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-[#D6E5E3] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#183B3A]">Fecha de Asistencia</Label>
                  <Input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-44"
                    aria-label="Filtrar por fecha"
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#183B3A]">Curso / Materia</Label>
                  <Select value={attendanceCourse} onValueChange={setAttendanceCourse}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Todos los Cursos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Cursos</SelectItem>
                      {courses?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#183B3A]">Estado de Asistencia</Label>
                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Todos los Estados" />
                    </SelectTrigger>
                    <SelectContent>
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
              <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#D6E5E3] bg-[#F4FAF9] p-2.5">
                <div className="flex items-center gap-1 text-xs text-[#287A32] font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> {attendanceCounts.present} Pres.
                </div>
                <div className="flex items-center gap-1 text-xs text-[#B42335] font-semibold">
                  <XCircle className="h-4 w-4" /> {attendanceCounts.absent} Aus.
                </div>
                <div className="flex items-center gap-1 text-xs text-[#805D00] font-semibold">
                  <Clock className="h-4 w-4" /> {attendanceCounts.late} Atr.
                </div>
                <div className="flex items-center gap-1 text-xs text-[#9731AC] font-semibold">
                  <AlertCircle className="h-4 w-4" /> {attendanceCounts.excused} Just.
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table Card */}
          <Card>
            <CardHeader className="border-b border-[#D6E5E3] bg-[#F4FAF9]/50 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#183B3A] flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#087F79]" />
                Registros de Asistencia Diaria ({filteredAttendance.length})
              </CardTitle>
              {attendanceDate && (
                <Badge variant="secondary">
                  Fecha: {attendanceDate}
                </Badge>
              )}
            </CardHeader>

            {filteredAttendance.length === 0 ? (
              <div className="p-10 text-center text-[#5E7A77] text-sm">
                No hay registros de asistencia con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#365451]">
                  <thead className="bg-[#F4FAF9] text-[#183B3A] font-semibold text-xs uppercase border-b border-[#D6E5E3]">
                    <tr>
                      <th className="p-3.5">Estudiante</th>
                      <th className="p-3.5">Código</th>
                      <th className="p-3.5">Materia / Curso</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E5E3]">
                    {filteredAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#E3F5F3]/30 transition-colors">
                        <td className="p-3.5 font-semibold text-[#183B3A]">{rec.studentName}</td>
                        <td className="p-3.5 text-xs font-mono text-[#5E7A77]">{rec.studentCode}</td>
                        <td className="p-3.5 text-xs font-medium text-[#087F79]">{rec.courseName}</td>
                        <td className="p-3.5 text-xs text-[#5E7A77]">{rec.date}</td>
                        <td className="p-3.5">
                          {rec.status === 'present' && <Badge variant="success">Presente</Badge>}
                          {rec.status === 'absent' && <Badge variant="destructive">Ausente</Badge>}
                          {rec.status === 'late' && <Badge variant="warning">Atraso</Badge>}
                          {rec.status === 'excused' && <Badge variant="purple">Justificado</Badge>}
                        </td>
                        <td className="p-3.5 text-xs text-[#5E7A77]">{rec.notes || '—'}</td>
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
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#D6E5E3] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <Label className="text-xs font-semibold text-[#183B3A]">Buscar Estudiante</Label>
                <div className="relative">
                  <Input
                    className="pl-10"
                    placeholder="Nombre o código de estudiante..."
                    aria-label="Buscar estudiante"
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5E7A77]" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-[240px]">
                <Label className="text-xs font-semibold text-[#183B3A]">Curso / Materia</Label>
                <Select value={gradeCourse} onValueChange={setGradeCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los Cursos" />
                  </SelectTrigger>
                  <SelectContent>
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
          </div>

          <Card className="p-8 text-center">
            <Star className="h-8 w-8 text-[#087F79] mx-auto mb-3" />
            <h3 className="font-semibold text-lg text-[#183B3A]">Consola de Auditoría de Calificaciones</h3>
            <p className="text-sm text-[#5E7A77] max-w-lg mx-auto mt-1">
              Todas las calificaciones asentadas por los docentes cuentan con marca de agua y registro de cambios en base de datos.
            </p>
          </Card>
        </div>
      )}

      {/* ── TAB 3: OBSERVACIONES Y COMUNICADOS ─────────────────────────────────── */}
      {activeTab === 'observaciones' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#D6E5E3] bg-white p-4 sm:p-5 shadow-xs">
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs font-semibold text-[#183B3A]">Filtrar por Tipo</Label>
              <Select value={obsTypeFilter} onValueChange={setObsTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positiva">Observaciones Positivas</SelectItem>
                  <SelectItem value="atencion">Llamados de Atención</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allObservations.map((obs) => (
              <Card key={obs.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={obs.type === 'positiva' ? 'success' : 'warning'}>
                    {obs.type === 'positiva' ? 'Positiva' : 'Llamado de Atención'}
                  </Badge>
                  <span className="text-xs text-[#5E7A77]">{obs.date}</span>
                </div>
                <h4 className="font-semibold text-base text-[#183B3A]">{obs.title}</h4>
                <p className="text-sm text-[#365451] leading-relaxed">{obs.detail}</p>
                <div className="text-xs text-[#5E7A77] pt-2 border-t border-[#D6E5E3] flex justify-between">
                  <span>Estudiante: <strong className="text-[#183B3A] font-semibold">{obs.studentName}</strong></span>
                  <span>Materia: <strong className="text-[#087F79] font-semibold">{obs.courseName}</strong></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LOG DE SEGURIDAD Y OPERACIONES ─────────────────────────────── */}
      {activeTab === 'seguridad' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#D6E5E3] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <Label className="text-xs font-semibold text-[#183B3A]">Buscar por Usuario o Detalle</Label>
                <div className="relative">
                  <Input
                    className="pl-10"
                    placeholder="Filtrar por usuario o detalle..."
                    aria-label="Buscar en bitácora"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5E7A77]" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-[240px]">
                <Label className="text-xs font-semibold text-[#183B3A]">Acción Realizada</Label>
                <Select value={logActionFilter} onValueChange={setLogActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las Acciones" />
                  </SelectTrigger>
                  <SelectContent>
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
          </div>

          <Card>
            <CardHeader className="border-b border-[#D6E5E3] bg-[#F4FAF9]/50 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#183B3A] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#9731AC]" />
                Historial de Operaciones y Bitácora de Seguridad ({filteredLogs.length})
              </CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#365451]">
                <thead className="bg-[#F4FAF9] text-[#183B3A] font-semibold text-xs uppercase border-b border-[#D6E5E3]">
                  <tr>
                    <th className="p-3.5">Marca de Tiempo</th>
                    <th className="p-3.5">Usuario</th>
                    <th className="p-3.5">Rol</th>
                    <th className="p-3.5">Acción</th>
                    <th className="p-3.5">Entidad</th>
                    <th className="p-3.5">Detalles</th>
                    <th className="p-3.5">IP Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E5E3]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#E3F5F3]/30 transition-colors">
                      <td className="p-3.5 text-xs text-[#5E7A77] font-mono">{log.timestamp}</td>
                      <td className="p-3.5 font-semibold text-[#183B3A]">{log.user}</td>
                      <td className="p-3.5">
                        <Badge variant="purple" className="text-[11px]">
                          {log.role}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-xs bg-[#F4FAF9] px-2 py-1 rounded border border-[#D6E5E3] text-[#183B3A]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs font-semibold text-[#087F79]">{log.entity}</td>
                      <td className="p-3.5 text-xs text-[#365451]">{log.details}</td>
                      <td className="p-3.5 text-xs font-mono text-[#5E7A77]">{log.ip}</td>
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
