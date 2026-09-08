import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileDown,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Megaphone,
  CheckSquare,
  Lock,
  Sparkles,
  BookOpen,
  User,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { teacherModuleService, getTodayStr } from '@/services/teacherModule.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SOFTWARE_CREATION_DATE = new Date(2026, 7, 1); // Agosto 2026

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function BitacoraPage() {
  const { user } = useAuth();
  const teacherName = user?.name ?? 'Profesor(a)';

  const todayStr = useMemo(() => getTodayStr(), []);

  const [currentYear, setCurrentYear] = useState<number>(SOFTWARE_CREATION_DATE.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(SOFTWARE_CREATION_DATE.getMonth());

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isMonthDisabled = (year: number, month: number) => {
    if (year < SOFTWARE_CREATION_DATE.getFullYear()) return true;
    if (year === SOFTWARE_CREATION_DATE.getFullYear() && month < SOFTWARE_CREATION_DATE.getMonth()) return true;
    return false;
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    if (!isMonthDisabled(newYear, newMonth)) {
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    }
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Lunes = 0

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isFuture: boolean;
      hasScheduled: boolean;
    }[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isDisabled: true,
        isFuture: false,
        hasScheduled: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;
      const monthBlocked = isMonthDisabled(currentYear, currentMonth);

      const isFuture = dateStr > todayStr;
      const bData = teacherModuleService.getBitacoraByDate(dateStr);
      const hasScheduled = isFuture && bData.scheduledActivities.length > 0;
      const isDisabled = monthBlocked || (isFuture && !hasScheduled);

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isDisabled,
        isFuture,
        hasScheduled,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  const bitacoraData = useMemo(() => {
    return teacherModuleService.getBitacoraByDate(selectedDate);
  }, [selectedDate]);

  const getDayEventsIndicator = (dateStr: string) => {
    if (!dateStr) return { attendance: false, activities: false, observations: false, announcements: false, scheduled: false };
    const b = teacherModuleService.getBitacoraByDate(dateStr);
    return {
      attendance: b.attendance.length > 0,
      activities: b.activities.length > 0,
      observations: b.observations.length > 0,
      announcements: b.announcements.length > 0,
      scheduled: b.scheduledActivities.length > 0,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pdf-report, #printable-pdf-report * {
            visibility: visible;
          }
          #printable-pdf-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
        }
      `}</style>

      <PageHeader
        eyebrow="Docente"
        title="Bitácora Pedagógica"
        description="Seguimiento cronológico y justificación de la labor docente: asistencias, actividades, observaciones y comunicados"
      >
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4 text-school-primary" />
          Exportar PDF Bitácora
        </Button>
      </PageHeader>

      {/* Barra de Filtro de Meses */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-school-subtle text-school-primary font-bold border border-school-border">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-school-heading flex items-center gap-2">
                <span>Período Seleccionado:</span>
                <span className="text-school-primary font-bold">{MONTH_NAMES[currentMonth]} {currentYear}</span>
              </h2>
              <p className="text-xs text-school-muted">
                Las fechas futuras están restringidas salvo días con actividades programadas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isMonthDisabled(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1)}
              title="Mes Anterior"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={`${currentYear}-${currentMonth}`}
              onValueChange={(val) => {
                const [y, m] = val.split('-').map(Number);
                setCurrentYear(y);
                setCurrentMonth(m);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar Mes" />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2027].map((yr) =>
                  MONTH_NAMES.map((mName, mIdx) => {
                    const disabled = isMonthDisabled(yr, mIdx);
                    return (
                      <SelectItem key={`${yr}-${mIdx}`} value={`${yr}-${mIdx}`} disabled={disabled}>
                        {mName} {yr} {disabled ? '🔒' : ''}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              title="Siguiente Mes"
              aria-label="Siguiente mes"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendario de Bitácora */}
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <h3 className="text-sm font-semibold text-school-heading flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-school-primary" />
            Calendario de Actividades y Novedades
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-school-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-school-success" /> Asistencia</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-school-primary" /> Finalizada</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-school-blue" /> Programada</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-school-violet" /> Observaciones</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-school-warning" /> Comunicados</span>
          </div>
        </div>

        {/* Grilla de Días */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-xs font-semibold text-school-muted uppercase tracking-wider py-2">
              {day}
            </div>
          ))}

          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-school-background/40" />;
            }

            const isSelected = selectedDate === item.dateStr;
            const indicators = getDayEventsIndicator(item.dateStr);

            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.isDisabled}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`h-16 rounded-xl p-2 flex flex-col justify-between items-center transition-colors relative border ${
                  isSelected
                    ? 'bg-school-primary text-white border-school-primary shadow-sm ring-2 ring-school-primary/30 z-10'
                    : item.isDisabled
                    ? 'bg-school-background/60 text-slate-400 border-school-border/40 cursor-not-allowed'
                    : item.hasScheduled
                    ? 'bg-school-subtle text-school-heading border-school-accent hover:border-school-primary'
                    : 'bg-white hover:bg-school-subtle/50 text-school-heading border-school-border hover:border-school-accent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-school-heading'}`}>
                    {item.dayNumber}
                  </span>
                  {item.isDisabled && <Lock className="h-3 w-3 text-slate-300" />}
                  {item.hasScheduled && !isSelected && <CalendarCheck className="h-3.5 w-3.5 text-school-blue" />}
                </div>

                {/* Indicadores de Eventos */}
                <div className="flex items-center gap-1 mt-1">
                  {indicators.attendance && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-school-success'}`} title="Asistencias" />
                  )}
                  {indicators.activities && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-school-primary'}`} title="Actividad finalizada" />
                  )}
                  {indicators.scheduled && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-school-blue'}`} title="Actividad programada" />
                  )}
                  {indicators.observations && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-school-violet'}`} title="Observaciones" />
                  )}
                  {indicators.announcements && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-school-warning'}`} title="Comunicados" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Desglose Detallado del Día Seleccionado */}
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-school-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-school-heading flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-school-primary" />
              Resumen del Día: <span className="text-school-primary">{selectedDate}</span>
              {selectedDate === todayStr && <Badge variant="success" className="ml-2">Hoy</Badge>}
              {selectedDate > todayStr && <Badge variant="secondary" className="ml-2">Fecha Futura</Badge>}
            </h3>
            <p className="text-xs text-school-muted font-normal mt-0.5">
              Docente: <strong>{teacherName}</strong> · Registros archivados: <strong>{bitacoraData.totalRecords}</strong>
            </p>
          </div>

          <Button size="sm" onClick={handlePrint} variant="outline" className="gap-1.5">
            <FileDown className="h-4 w-4 text-school-primary" />
            Descargar PDF del Día
          </Button>
        </div>

        {bitacoraData.totalRecords === 0 ? (
          <div className="py-12 text-center text-school-muted bg-school-background rounded-xl border border-dashed border-school-border">
            <CalendarIcon className="h-10 w-10 mx-auto text-school-muted mb-2" />
            <p className="font-semibold text-school-heading text-sm">Sin registros archivados para esta fecha</p>
            <p className="text-xs text-school-muted max-w-sm mx-auto mt-1">
              Al guardar asistencias, comunicados u observaciones para esta fecha, se reflejarán automáticamente en esta bitácora.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Actividades Programadas */}
            {bitacoraData.isFuture && bitacoraData.scheduledActivities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-school-border pb-2">
                  <CalendarCheck className="h-4 w-4 text-school-blue" />
                  <h4 className="font-semibold text-school-heading text-sm">Actividades Programadas ({bitacoraData.scheduledActivities.length})</h4>
                  <Badge variant="outline" className="text-xs">Fecha Futura</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.scheduledActivities.map((act) => (
                    <div key={act.id} className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">Programada</Badge>
                        <span className="text-xs text-school-muted font-medium">{act.courseName}</span>
                      </div>
                      <p className="font-semibold text-school-heading text-sm mt-1">{act.title}</p>
                      <p className="text-xs text-school-muted">{act.description}</p>
                      <p className="text-xs text-school-primary font-medium mt-1">Límite: {act.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Asistencias Tomadas */}
            {!bitacoraData.isFuture && bitacoraData.attendance.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-school-border pb-2">
                  <ClipboardCheck className="h-4 w-4 text-school-success" />
                  <h4 className="font-semibold text-school-heading text-sm">Asistencias Registradas ({bitacoraData.attendance.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {bitacoraData.attendance.map((rec) => (
                    <div key={rec.id} className="p-3 rounded-xl border border-school-border bg-school-background/40 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-school-heading">{rec.studentName}</p>
                        <p className="text-school-muted">{rec.courseName} · {rec.studentCode}</p>
                      </div>
                      <Badge variant={
                        rec.status === 'present' ? 'success' :
                        rec.status === 'absent' ? 'destructive' :
                        rec.status === 'late' ? 'warning' : 'secondary'
                      }>
                        {rec.status === 'present' ? 'Presente' : rec.status === 'absent' ? 'Ausente' : rec.status === 'late' ? 'Atraso' : 'Justificado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Actividades Finalizadas */}
            {!bitacoraData.isFuture && bitacoraData.activities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-school-border pb-2">
                  <CheckSquare className="h-4 w-4 text-school-primary" />
                  <h4 className="font-semibold text-school-heading text-sm">Actividades Finalizadas ({bitacoraData.activities.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.activities.map((act) => (
                    <div key={act.id} className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="success" className="text-xs">Finalizada</Badge>
                        <span className="text-xs text-school-muted font-medium">{act.courseName}</span>
                      </div>
                      <p className="font-semibold text-school-heading text-sm mt-1">{act.title}</p>
                      <p className="text-xs text-school-muted">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Observaciones Registradas */}
            {!bitacoraData.isFuture && bitacoraData.observations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-school-border pb-2">
                  <MessageSquare className="h-4 w-4 text-school-violet" />
                  <h4 className="font-semibold text-school-heading text-sm">Observaciones Registradas ({bitacoraData.observations.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.observations.map((obs) => (
                    <div key={obs.id} className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-school-heading text-sm">{obs.studentName} ({obs.studentCode})</p>
                        <Badge variant={obs.type === 'positiva' ? 'success' : obs.type === 'atencion' ? 'destructive' : 'secondary'} className="text-xs">
                          {obs.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-medium text-xs text-school-heading">{obs.title}</p>
                      <p className="text-xs text-school-muted">{obs.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Comunicados Publicados */}
            {!bitacoraData.isFuture && bitacoraData.announcements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-school-border pb-2">
                  <Megaphone className="h-4 w-4 text-school-warning" />
                  <h4 className="font-semibold text-school-heading text-sm">Comunicados Publicados ({bitacoraData.announcements.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-xl border border-school-border bg-school-background/50 space-y-1">
                      <p className="font-semibold text-school-heading text-sm">{ann.title}</p>
                      <p className="text-xs text-school-muted">{ann.content}</p>
                      <p className="text-xs text-school-muted mt-1 font-medium">Dirigido a: {ann.courseName ?? 'Todos los cursos'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Reporte imprimible oculto */}
      <div id="printable-pdf-report" className="hidden">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Reporte Docente: {teacherName}</h1>
          <p className="text-sm font-semibold text-slate-600">Bitácora Oficial de Trabajo Pedagógico Diario</p>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
            <span>Fecha: <strong>{selectedDate}</strong></span>
            <span>Institución: Colegio San Andrés / NICE KIDS</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">1. Resumen Ejecutivo del Día</h2>
            <ul className="text-xs space-y-1 text-slate-700">
              <li>• Registros de Asistencia: <strong>{bitacoraData.attendance.length}</strong></li>
              <li>• Actividades Finalizadas: <strong>{bitacoraData.activities.length}</strong></li>
              <li>• Actividades Programadas (Futuras): <strong>{bitacoraData.scheduledActivities.length}</strong></li>
              <li>• Observaciones Registradas: <strong>{bitacoraData.observations.length}</strong></li>
              <li>• Comunicados Emitidos: <strong>{bitacoraData.announcements.length}</strong></li>
            </ul>
          </div>

          {bitacoraData.attendance.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">2. Detalle de Asistencias</h2>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2 font-bold">Estudiante</th>
                    <th className="border p-2 font-bold">Código</th>
                    <th className="border p-2 font-bold">Curso</th>
                    <th className="border p-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {bitacoraData.attendance.map((a) => (
                    <tr key={a.id}>
                      <td className="border p-2">{a.studentName}</td>
                      <td className="border p-2">{a.studentCode}</td>
                      <td className="border p-2">{a.courseName}</td>
                      <td className="border p-2 uppercase font-bold">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-12 text-center text-xs text-slate-400">
            ________________________________________<br />
            Firma del Docente: {teacherName}
          </div>
        </div>
      </div>
    </div>
  );
}
