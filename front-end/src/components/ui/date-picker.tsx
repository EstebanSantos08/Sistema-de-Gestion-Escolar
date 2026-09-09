import { useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input, type InputProps } from './input';
import { Button } from './button';

type DatePickerProps = Omit<InputProps, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  type?: 'date' | 'datetime-local';
};

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Keeps the native editable field and validation; the shared calendar uses local dates. */
export function DatePicker({ value, onValueChange, type = 'date', min, max, disabled, className, ...props }: DatePickerProps) {
  const id = useId();
  const popover = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [month, setMonth] = useState(() => parseDate(value));
  const [focused, setFocused] = useState(() => value.slice(0, 10) || localDate(new Date()));
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const today = localDate(new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  const allowed = (day: string) => (!min || day >= String(min).slice(0, 10)) && (!max || day <= String(max).slice(0, 10));

  function focusDate(date: Date) {
    const next = localDate(date);
    setMonth(date);
    setFocused(next);
    requestAnimationFrame(() => popover.current?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus());
  }
  function changeMonth(delta: number) {
    focusDate(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }
  function selectDate(day: string) {
    if (!allowed(day)) return;
    let next = type === 'datetime-local' ? `${day}T${value.split('T')[1]?.slice(0, 5) || '23:59'}` : day;
    if (min && next < String(min)) next = String(min);
    if (max && next > String(max)) next = String(max);
    onValueChange(next);
    popover.current?.hidePopover();
    trigger.current?.focus();
  }
  return (
    <div className="relative min-w-0">
      <Input {...props} type={type} lang="es" value={value} onChange={(event) => onValueChange(event.target.value)} min={min} max={max} disabled={disabled} className={`nk-date-input pr-12 ${className ?? ''}`} />
      <button ref={trigger} type="button" disabled={disabled} aria-label="Abrir calendario" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} popoverTarget={id}
        className="absolute right-1 top-1 flex h-9 w-10 items-center justify-center rounded-lg text-ink-turquoise hover:bg-school-subtle disabled:opacity-50"
        onClick={() => {
          const rect = trigger.current!.getBoundingClientRect();
          setPosition({ top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 408)), left: Math.max(8, Math.min(rect.right - 336, window.innerWidth - 344)) });
          const date = parseDate(value);
          setMonth(date); setFocused(localDate(date));
        }}>
        <CalendarDays aria-hidden="true" className="h-5 w-5" />
      </button>
      <div ref={popover} id={id} popover="auto" role="dialog" aria-label="Elegir fecha" className="nk-calendar" style={position}
        onToggle={(event) => {
          const isOpen = event.newState === 'open';
          setOpen(isOpen);
          if (isOpen) requestAnimationFrame(() => popover.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus());
        }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <p aria-live="polite" className="text-sm font-semibold capitalize text-school-heading">{month.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}</p>
          <Button type="button" variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div role="grid" aria-label="Días del mes" onKeyDown={(event) => {
          const movement: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
          const date = parseDate(focused);
          if (event.key in movement) { event.preventDefault(); date.setDate(date.getDate() + movement[event.key]); focusDate(date); }
          else if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); changeMonth(event.key === 'PageUp' ? -1 : 1); }
          else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); date.setDate(date.getDate() - (date.getDay() + 6) % 7 + (event.key === 'End' ? 6 : 0)); focusDate(date); }
        }}>
          <div role="row" className="grid grid-cols-7 text-center text-sm text-school-muted-readable">{['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => <span role="columnheader" key={day} className="py-2">{day}</span>)}</div>
          {Array.from({ length: 6 }, (_, week) => (
            <div role="row" key={week} className="grid grid-cols-7">
              {days.slice(week * 7, week * 7 + 7).map(date => {
                const day = localDate(date);
                return <div role="gridcell" aria-selected={day === value.slice(0, 10)} key={day}>
                  <button type="button" data-day={day} tabIndex={day === focused ? 0 : -1} aria-label={date.toLocaleDateString('es-EC', { dateStyle: 'full' })} aria-current={day === today ? 'date' : undefined} aria-disabled={!allowed(day)} data-selected={day === value.slice(0, 10)} data-outside={date.getMonth() !== month.getMonth()} className="nk-calendar-day" onFocus={() => setFocused(day)} onClick={() => selectDate(day)}>{date.getDate()}</button>
                </div>;
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line-turquoise pt-3">
          <Button type="button" variant="secondary" size="sm" disabled={!allowed(today)} onClick={() => selectDate(today)}>Hoy</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { popover.current?.hidePopover(); trigger.current?.focus(); }}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
