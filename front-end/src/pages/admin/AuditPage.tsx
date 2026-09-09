import { DatePicker } from '@/components/ui/date-picker';
import { useState } from 'react';
import {
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { auditLogService, type AuditLogFilters } from '@/services/auditLog.service';
import type { NormalizedAuditLog } from '@/types';

export default function AuditPage() {
  // Filters state
  const [page, setPage] = useState<number>(1);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [selectedGradeCat, setSelectedGradeCat] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  // Expanded row ID for secondary details
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Load available filter options from backend
  const { data: filterOptions } = useQuery({
    queryKey: ['audit-log-filters'],
    queryFn: () => auditLogService.getFilters(),
  });

  // Query audit logs with active filters
  const activeFilters: AuditLogFilters = {
    page,
    limit: 25,
    from: fromDate || undefined,
    to: toDate || undefined,
    teacher: selectedTeacher !== 'all' ? Number(selectedTeacher) : undefined,
    student: selectedStudent !== 'all' ? Number(selectedStudent) : undefined,
    course: selectedCourse !== 'all' ? Number(selectedCourse) : undefined,
    activity: selectedActivity !== 'all' ? Number(selectedActivity) : undefined,
    gradeCategory: selectedGradeCat !== 'all' ? selectedGradeCat : undefined,
    action: selectedAction !== 'all' ? selectedAction : undefined,
  };

  const {
    data: auditData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', activeFilters],
    queryFn: () => auditLogService.list(activeFilters),
  });

  const logs = auditData?.logs ?? [];
  const totalLogs = auditData?.total ?? 0;
  const totalPages = auditData?.totalPages ?? 1;

  const resetFilters = () => {
    setPage(1);
    setFromDate('');
    setToDate('');
    setSelectedTeacher('all');
    setSelectedStudent('all');
    setSelectedCourse('all');
    setSelectedActivity('all');
    setSelectedGradeCat('all');
    setSelectedAction('all');
  };

  const exportAuditReport = () => {
    if (logs.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }
    const headers = ['ID', 'Fecha', 'Actor', 'Rol', 'Acción', 'Estudiante', 'Curso', 'Actividad', 'Detalles'];
    const csvRows = logs.map((l) => [
      l.id,
      new Date(l.createdAt || (l as any).when).toLocaleString('es-ES'),
      `"${l.actor?.name || 'N/A'}"`,
      l.actor?.role || 'N/A',
      l.action,
      `"${l.studentName || ''}"`,
      `"${l.courseName || ''}"`,
      `"${l.activityTitle || ''}"`,
      `"${JSON.stringify({ old: l.oldValues, new: l.newValues }).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Informe de auditoría exportado exitosamente en formato CSV');
  };

  const formatActionBadge = (action: string) => {
    if (action.includes('TASK_GRADE')) {
      return (
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
          Nota Tarea
        </Badge>
      );
    }
    if (action.includes('ACADEMIC_GRADE')) {
      return (
        <Badge variant="outline" className="text-xs bg-surface-blue text-ink-blue border-line-blue">
          Nota Académica
        </Badge>
      );
    }
    if (action.includes('CREATED') || action.includes('UPLOAD')) {
      return <Badge variant="success" className="text-xs">{action}</Badge>;
    }
    if (action.includes('UPDATED') || action.includes('REPLACED')) {
      return <Badge variant="warning" className="text-xs">{action}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{action}</Badge>;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Administración y Seguridad"
        title="Bitácora & Auditoría del Sistema"
        description="Consola institucional de trazabilidad: supervisión de cambios en notas, evidencias, actividades y accesos con registro de valores previos y posteriores"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} size="sm" className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Actualizar
          </Button>
          <Button variant="context" onClick={exportAuditReport} className="h-9 gap-1.5" size="sm">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Auditoría (CSV)
          </Button>
        </div>
      </PageHeader>

      {/* Filter panel */}
      <Card className="nk-filter p-5">
        <div className="flex items-center justify-between pb-3 border-b border-school-border/60 mb-4">
          <span className="text-sm font-bold text-school-heading flex items-center gap-2">
            <span className="nk-icon"><Filter className="h-4 w-4" /></span> Filtros de Auditoría
          </span>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-school-muted-readable hover:text-ink-turquoise">
            Limpiar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Rango Desde */}
          <div className="space-y-1">
            <Label htmlFor="audit-from" className="text-sm font-semibold text-school-heading">Desde:</Label>
            <DatePicker
              type="date"
              id="audit-from"
              value={fromDate}
              onValueChange={(value) => {
                setFromDate(value);
                setPage(1);
              }}
              className="h-11 text-sm bg-white"
            />
          </div>

          {/* Rango Hasta */}
          <div className="space-y-1">
            <Label htmlFor="audit-to" className="text-sm font-semibold text-school-heading">Hasta:</Label>
            <DatePicker
              type="date"
              id="audit-to"
              value={toDate}
              onValueChange={(value) => {
                setToDate(value);
                setPage(1);
              }}
              className="h-11 text-sm bg-white"
            />
          </div>

          {/* Categoría de Calificación */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Tipo de Calificación:</Label>
            <Select
              value={selectedGradeCat}
              onValueChange={(val) => {
                setSelectedGradeCat(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todas las notas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las calificaciones</SelectItem>
                <SelectItem value="task">Notas de Tareas / Actividades</SelectItem>
                <SelectItem value="academic">Notas Académicas Oficiales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Acción */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Acción:</Label>
            <Select
              value={selectedAction}
              onValueChange={(val) => {
                setSelectedAction(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="created">Creaciones (Nuevas notas/evidencias)</SelectItem>
                <SelectItem value="modified">Modificaciones / Actualizaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Docente */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Docente (Actor):</Label>
            <Select
              value={selectedTeacher}
              onValueChange={(val) => {
                setSelectedTeacher(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todos los docentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los docentes</SelectItem>
                {filterOptions?.teachers?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name || `Docente #${t.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estudiante Afectado */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Estudiante:</Label>
            <Select
              value={selectedStudent}
              onValueChange={(val) => {
                setSelectedStudent(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todos los estudiantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estudiantes</SelectItem>
                {filterOptions?.students?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name || `Estudiante #${s.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Curso */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Curso / Materia:</Label>
            <Select
              value={selectedCourse}
              onValueChange={(val) => {
                setSelectedCourse(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {filterOptions?.courses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actividad */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-school-heading">Actividad:</Label>
            <Select
              value={selectedActivity}
              onValueChange={(val) => {
                setSelectedActivity(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 text-sm">
                <SelectValue placeholder="Todas las actividades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las actividades</SelectItem>
                {filterOptions?.activities?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden shadow-xs">
        <div className="p-4 border-b border-school-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ink-turquoise" />
            <span className="font-bold text-sm text-school-heading">Eventos Auditados</span>
            <Badge variant="secondary" className="text-xs">{totalLogs} en total</Badge>
          </div>
          <span className="text-xs text-school-muted-readable">Página {page} de {totalPages}</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-ink-turquoise mb-3" />
            <p className="text-school-muted-readable text-sm font-medium">Cargando registros de auditoría institucional...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-600">
            <p className="font-semibold text-sm">Error al cargar registros de auditoría.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-school-muted-readable">
            <Search className="h-10 w-10 mx-auto text-school-muted-readable mb-2" />
            <p className="font-semibold text-school-heading text-sm">No se encontraron eventos</p>
            <p className="text-xs text-school-muted-readable mt-1">Intenta ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="nk-table w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-school-border bg-school-background text-school-muted-readable uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Fecha y Hora</th>
                  <th className="py-3 px-3">Quién (Actor)</th>
                  <th className="py-3 px-3">Acción</th>
                  <th className="py-3 px-3">Estudiante</th>
                  <th className="py-3 px-3">Curso / Actividad</th>
                  <th className="py-3 px-3">Valores Anteriores → Nuevos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-school-border/60">
                {logs.map((log: NormalizedAuditLog) => {
                  const isExpanded = expandedRowId === log.id;
                  const hasValues = log.oldValues || log.newValues;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-school-subtle/30 transition-colors ${isExpanded ? 'bg-school-subtle/40' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                          className="p-1 hover:bg-school-subtle rounded text-school-muted-readable"
                          title="Ver detalles extendidos"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-school-body">
                        {new Date(log.createdAt || (log as any).when).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-school-heading">{log.actor?.name || `Usuario #${log.actor?.id}`}</p>
                        <p className="text-[10px] text-school-muted-readable capitalize">{log.actor?.role || 'Docente'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {formatActionBadge(log.action)}
                          <p className="text-[10px] text-school-muted-readable font-mono">{log.action}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {log.studentName ? (
                          <span className="font-semibold text-school-heading">{log.studentName}</span>
                        ) : log.studentId ? (
                          <span className="text-school-muted-readable">ID: {log.studentId}</span>
                        ) : (
                          <span className="text-school-muted-readable italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-school-heading">{log.courseName || '-'}</p>
                        {log.activityTitle && (
                          <p className="text-[10px] text-school-muted-readable">Tarea: {log.activityTitle}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        {hasValues ? (
                          <div className="space-y-1">
                            {log.oldValues && (
                              <div className="text-sm text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                <strong>Antes:</strong> {JSON.stringify(log.oldValues)}
                              </div>
                            )}
                            {log.newValues && (
                              <div className="text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <strong>Ahora:</strong> {JSON.stringify(log.newValues)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-school-muted-readable italic">Sin cambios numéricos</span>
                        )}

                        {/* Secondary expandable detail */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-dashed border-school-border text-[10px] text-school-muted-readable bg-white p-2 rounded shadow-2xs">
                            <p><strong>IP:</strong> {log.ipAddress || '127.0.0.1'}</p>
                            <p><strong>Log ID:</strong> {log.id}</p>
                            <p><strong>Categoría:</strong> {log.gradeCategory || 'general'}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <div className="p-3.5 border-t border-school-border/60 bg-school-background flex items-center justify-between text-xs">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-school-muted-readable font-medium">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
