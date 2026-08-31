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

// Fecha base de creación del software (Mes actual: Agosto 2026)
const SOFTWARE_CREATION_DATE = new Date(2026, 7, 1); // Agosto 2026 (mes 7 = Agosto)

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function BitacoraPage() {
  const { user } = useAuth();
  const teacherName = user?.name ?? 'Profesor(a)';

  // Fecha actual local de hoy en formato YYYY-MM-DD
  const todayStr = useMemo(() => getTodayStr(), []);

  // Estado para el mes y año seleccionado en el calendario
  const [currentYear, setCurrentYear] = useState<number>(SOFTWARE_CREATION_DATE.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(SOFTWARE_CREATION_DATE.getMonth()); // 0-indexed

  // Estado para el día seleccionado en la bitácora (por defecto fecha de hoy en formato YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Limite histórico: comprobar si un año/mes es anterior a la fecha de creación del software
  const isMonthDisabled = (year: number, month: number) => {
    if (year < SOFTWARE_CREATION_DATE.getFullYear()) return true;
    if (year === SOFTWARE_CREATION_DATE.getFullYear() && month < SOFTWARE_CREATION_DATE.getMonth()) return true;
    return false;
  };

  // Navegación de meses hacia adelante/atrás (bloqueada hacia atrás del software)
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

  // Generación de la grilla de días del mes seleccionado
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

    // Días vacíos del mes anterior
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

    // Días del mes activo
    for (let d = 1; d <= daysInMonth; d++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;
      const monthBlocked = isMonthDisabled(currentYear, currentMonth);

      const isFuture = dateStr > todayStr;

      // Comprobar si en esta fecha futura existe al menos una actividad programada
      const bData = teacherModuleService.getBitacoraByDate(dateStr);
      const hasScheduled = isFuture && bData.scheduledActivities.length > 0;

      // Regla de bloqueo estricta:
      // Si la fecha es futura, se encuentra BLOQUEADA a menos que tenga una actividad programada
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

  // Cargar registros completos de la fecha seleccionada desde el servicio
  const bitacoraData = useMemo(() => {
    return teacherModuleService.getBitacoraByDate(selectedDate);
  }, [selectedDate]);

  // Obtener indicadores (puntos de colores) para cada fecha del calendario
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

  // Imprimir / Exportar PDF de la Bitácora
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Estilos para imprimir exclusivamente el reporte en PDF */}
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

      {/* Page Header */}
      <PageHeader
        title="Bitácora Docente"
        description="Justificación diaria de la labor docente: asistencias, actividades finalizadas, observaciones y comunicados"
      >
        <Button onClick={handlePrint} className="bg-[#008BC1] hover:bg-[#0073A0] text-white shadow-md rounded-xl font-bold">
          <Printer className="mr-2 h-4 w-4" />
          Exportar PDF Bitácora
        </Button>
      </PageHeader>

      {/* Barra de Filtro de Meses y Bloqueo Histórico */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#008BC1] border border-teal-100 shadow-inner font-bold">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>Período Seleccionado:</span>
                <span className="text-[#09A9C2] font-black">{MONTH_NAMES[currentMonth]} {currentYear}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Regla de validación: fechas futuras están bloqueadas por defecto, salvo días con actividades programadas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isMonthDisabled(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1)}
              className="rounded-xl border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              title="Mes Anterior (Bloqueado si es anterior a creación del software)"
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
              <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800 font-bold rounded-xl shadow-xs">
                <SelectValue placeholder="Seleccionar Mes" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
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
              className="rounded-xl border-slate-200 hover:bg-slate-100"
              title="Siguiente Mes"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendario Animado e Interactivo (Nice Kids UI) */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#008BC1] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F4B51B]" />
            Calendario de Bitácora y Actividades
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#31B45A]" /> Asistencias</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#008BC1]" /> Actividad Finalizada</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-sky-300" /> Programada (Futura)</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#7D5AA6]" /> Observaciones</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#F4B51B]" /> Comunicados</span>
          </div>
        </div>

        {/* Grilla de Días */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-xs font-black text-slate-500 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}

          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-50/40" />;
            }

            const isSelected = selectedDate === item.dateStr;
            const indicators = getDayEventsIndicator(item.dateStr);

            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.isDisabled}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`h-16 rounded-xl p-2 flex flex-col justify-between items-center transition-all duration-200 relative group border ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#008BC1] to-[#09A9C2] text-white border-sky-400 shadow-lg shadow-sky-500/25 scale-[1.03] z-10'
                    : item.isDisabled
                    ? 'bg-slate-100/60 text-slate-300 border-slate-100 cursor-not-allowed'
                    : item.hasScheduled
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 hover:shadow-md'
                    : 'bg-white hover:bg-sky-50/70 text-slate-700 border-slate-200/80 hover:border-[#09A9C2] hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-extrabold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {item.dayNumber}
                  </span>
                  {item.isDisabled && <Lock className="h-3 w-3 text-slate-300" />}
                  {item.hasScheduled && !isSelected && <CalendarCheck className="h-3.5 w-3.5 text-sky-600" />}
                </div>

                {/* Indicadores de Actividades en el Día */}
                <div className="flex items-center gap-1 mt-1">
                  {indicators.attendance && (
                    <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-[#31B45A]'} animate-pulse`} title="Asistencias registradas" />
                  )}
                  {indicators.activities && (
                    <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-sky-200' : 'bg-[#008BC1]'}`} title="Actividad finalizada" />
                  )}
                  {indicators.scheduled && (
                    <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-sky-100' : 'bg-sky-500'} ring-1 ring-sky-300`} title="Actividad programada" />
                  )}
                  {indicators.observations && (
                    <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-purple-200' : 'bg-[#7D5AA6]'}`} title="Observaciones registradas" />
                  )}
                  {indicators.announcements && (
                    <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-[#F4B51B]'}`} title="Comunicados publicados" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Desglose Detallado del Día Seleccionado */}
      <Card className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#31B45A]" />
              Resumen del Día: <span className="text-[#008BC1]">{selectedDate}</span>
              {selectedDate === todayStr && <Badge className="bg-[#31B45A] text-white font-bold ml-2">Hoy</Badge>}
              {selectedDate > todayStr && <Badge className="bg-sky-600 text-white font-bold ml-2">Fecha Futura</Badge>}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Docente responsable: <strong>{teacherName}</strong> · Registros encontrados: <strong>{bitacoraData.totalRecords}</strong>
            </p>
          </div>

          <Button size="sm" onClick={handlePrint} variant="outline" className="border-[#008BC1] text-[#008BC1] hover:bg-[#008BC1] hover:text-white font-bold rounded-xl">
            <FileDown className="mr-1.5 h-4 w-4" />
            Descargar PDF del Día
          </Button>
        </div>

        {bitacoraData.totalRecords === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-extrabold text-slate-600 text-sm">Sin registros archivados para esta fecha</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Las fechas futuras se mantienen bloqueadas salvo que cuenten con una actividad programada. Al guardar asistencias, comunicados u observaciones del día, se actualizarán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Actividades Programadas (Para fechas futuras) */}
            {bitacoraData.isFuture && bitacoraData.scheduledActivities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
                  <CalendarCheck className="h-5 w-5 text-sky-600" />
                  <h4 className="font-extrabold text-slate-800 text-sm">Actividades Programadas ({bitacoraData.scheduledActivities.length})</h4>
                  <Badge variant="outline" className="text-xs border-sky-500 text-sky-700 font-bold">Fecha Futura - Pendiente de Ejecución</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.scheduledActivities.map((act) => (
                    <div key={act.id} className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-sky-600 text-white font-bold text-[10px]">Programada / En Curso</Badge>
                        <span className="text-xs text-slate-500 font-bold">{act.courseName}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm mt-1">{act.title}</p>
                      <p className="text-xs text-slate-600">{act.description}</p>
                      <p className="text-[10px] text-sky-800 font-bold mt-1">Fecha límite programada: {act.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Asistencias Tomadas */}
            {!bitacoraData.isFuture && bitacoraData.attendance.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ClipboardCheck className="h-5 w-5 text-[#31B45A]" />
                  <h4 className="font-extrabold text-slate-800 text-sm">Asistencias Tomadas ({bitacoraData.attendance.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {bitacoraData.attendance.map((rec) => (
                    <div key={rec.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{rec.studentName}</p>
                        <p className="text-slate-500 font-medium">{rec.courseName} · {rec.studentCode}</p>
                      </div>
                      <Badge className={
                        rec.status === 'present' ? 'bg-[#31B45A] text-white font-bold' :
                        rec.status === 'absent' ? 'bg-[#E84B5B] text-white font-bold' :
                        rec.status === 'late' ? 'bg-amber-500 text-white font-bold' : 'bg-blue-600 text-white font-bold'
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
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckSquare className="h-5 w-5 text-[#008BC1]" />
                  <h4 className="font-extrabold text-slate-800 text-sm">Actividades Finalizadas ({bitacoraData.activities.length})</h4>
                  <Badge variant="outline" className="text-xs border-[#008BC1] text-[#008BC1] font-bold">Estado: Finalizada</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.activities.map((act) => (
                    <div key={act.id} className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Finalizada / Completada</Badge>
                        <span className="text-xs text-slate-500 font-bold">{act.courseName}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm mt-1">{act.title}</p>
                      <p className="text-xs text-slate-600">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Observaciones Registradas */}
            {!bitacoraData.isFuture && bitacoraData.observations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MessageSquare className="h-5 w-5 text-[#7D5AA6]" />
                  <h4 className="font-extrabold text-slate-800 text-sm">Observaciones Registradas ({bitacoraData.observations.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.observations.map((obs) => (
                    <div key={obs.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 text-sm">{obs.studentName} ({obs.studentCode})</p>
                        <Badge className="bg-[#7D5AA6] text-white font-bold text-[10px]">{obs.type.toUpperCase()}</Badge>
                      </div>
                      <p className="font-bold text-xs text-purple-900">{obs.title}</p>
                      <p className="text-xs text-slate-600">{obs.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Comunicados Publicados */}
            {!bitacoraData.isFuture && bitacoraData.announcements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Megaphone className="h-5 w-5 text-[#F4B51B]" />
                  <h4 className="font-extrabold text-slate-800 text-sm">Comunicados Publicados ({bitacoraData.announcements.length})</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bitacoraData.announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-1">
                      <p className="font-bold text-slate-800 text-sm">{ann.title}</p>
                      <p className="text-xs text-slate-600">{ann.content}</p>
                      <p className="text-[10px] text-amber-800 font-bold mt-1">Dirigido a: {ann.courseName ?? 'Todos los cursos'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Contenedor Oculto Formateado Exclusivamente para Exportación a PDF/Impresión */}
      <div id="printable-pdf-report" className="hidden">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-black text-slate-900 uppercase">Reporte Docente {teacherName}</h1>
          <p className="text-sm font-bold text-slate-600">Bitácora Oficial de Justificación de Trabajo Pedagógico Diario</p>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
            <span>Fecha de emisión: <strong>{selectedDate}</strong></span>
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

          {bitacoraData.scheduledActivities.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">2. Actividades Programadas (Fecha Futura)</h2>
              <div className="space-y-2">
                {bitacoraData.scheduledActivities.map((act) => (
                  <div key={act.id} className="p-2 border rounded text-xs">
                    <p className="font-bold">{act.title} ({act.courseName}) - [PROGRAMADA]</p>
                    <p className="text-slate-600">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bitacoraData.attendance.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">3. Detalle de Asistencias</h2>
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

          {bitacoraData.activities.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">4. Actividades Finalizadas</h2>
              <div className="space-y-2">
                {bitacoraData.activities.map((act) => (
                  <div key={act.id} className="p-2 border rounded text-xs">
                    <p className="font-bold">{act.title} ({act.courseName})</p>
                    <p className="text-slate-600">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bitacoraData.observations.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">5. Observaciones a Estudiantes</h2>
              <div className="space-y-2">
                {bitacoraData.observations.map((obs) => (
                  <div key={obs.id} className="p-2 border rounded text-xs">
                    <p className="font-bold">{obs.studentName} - {obs.title} [{obs.type.toUpperCase()}]</p>
                    <p className="text-slate-600">{obs.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bitacoraData.announcements.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b pb-1 mb-2">6. Comunicados Publicados</h2>
              <div className="space-y-2">
                {bitacoraData.announcements.map((ann) => (
                  <div key={ann.id} className="p-2 border rounded text-xs">
                    <p className="font-bold">{ann.title}</p>
                    <p className="text-slate-600">{ann.content}</p>
                  </div>
                ))}
              </div>
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
