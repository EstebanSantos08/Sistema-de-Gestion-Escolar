import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Eye, EyeOff, AlertTriangle, CheckCircle2, AlertCircle, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useObservations } from '@/hooks/useObservations';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BackendObservation } from '@/types';

const HIDDEN_KEY = 'student_hidden_observations';

function getHiddenIds(): number[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addHiddenId(id: number): void {
  const ids = getHiddenIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
  }
}

export default function StudentObservationsPage() {
  const { user } = useAuth();
  const { data: allObservations = [], isLoading, isError } = useObservations();
  const [hiddenIds, setHiddenIds] = useState<number[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const visibleObservations = useMemo(() => {
    return allObservations.filter((obs) => !hiddenIds.includes(obs.id));
  }, [allObservations, hiddenIds]);

  const observationToDelete = useMemo(() => {
    if (!confirmDeleteId) return null;
    return allObservations.find((o) => o.id === confirmDeleteId) ?? null;
  }, [confirmDeleteId, allObservations]);

  const openDeleteDialog = useCallback((id: number) => {
    setConfirmDeleteId(id);
    setStep(1);
  }, []);

  const handleConfirmHide = useCallback(() => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (confirmDeleteId) {
      addHiddenId(confirmDeleteId);
      setHiddenIds(getHiddenIds());
    }
    setConfirmDeleteId(null);
    setStep(1);
  }, [step, confirmDeleteId]);

  const closeDialog = useCallback(() => {
    setConfirmDeleteId(null);
    setStep(1);
  }, []);

  const getObservationBadge = (type: string) => {
    switch (type) {
      case 'ACADEMIC':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Académica
          </Badge>
        );
      case 'BEHAVIORAL':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Conductual
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" /> General
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/estudiante">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-school-primary" /> Volver al Dashboard
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Estudiante"
        title="Mis Observaciones"
        description="Seguimiento formativo, reconocimientos y notas pedagógicas emitidas por tus docentes"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-school-success mb-1" />
          <p className="text-2xl font-bold text-school-success">
            {visibleObservations.filter((o) => o.type === 'ACADEMIC').length}
          </p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Académicas</p>
        </Card>
        <Card className="p-4 text-center">
          <Info className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">
            {visibleObservations.filter((o) => o.type === 'GENERAL').length}
          </p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Generales</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">
            {visibleObservations.filter((o) => o.type === 'BEHAVIORAL').length}
          </p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Conductuales</p>
        </Card>
      </div>

      {/* Observations List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto text-school-primary animate-spin mb-3" />
          <p className="text-school-muted font-medium">Cargando tus observaciones institucionales...</p>
        </Card>
      ) : isError ? (
        <Card className="p-12 text-center text-red-600">
          <p className="font-semibold">No se pudieron cargar tus observaciones.</p>
        </Card>
      ) : visibleObservations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No tienes observaciones visibles</p>
          <p className="text-sm text-school-muted mt-1">No hay observaciones registradas o has ocultado las existentes.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleObservations.map((obs: BackendObservation) => (
            <Card key={obs.id} className="hover:border-school-accent transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-school-heading text-base">{obs.title}</h3>
                      {getObservationBadge(obs.type)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-school-muted font-medium flex-wrap">
                      <span>📅 {new Date(obs.date || obs.createdAt).toLocaleDateString('es-ES')}</span>
                      {obs.teacher?.user?.name && (
                        <>
                          <span>·</span>
                          <span>Docente: {obs.teacher.user.name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-school-primary" />
                        {obs.visibility === 'SOLO_ESTUDIANTE' ? 'Visible solo para ti' : 'Visible para familia'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(obs.id)}
                    className="text-school-muted hover:text-school-error hover:bg-school-error/10 shrink-0"
                    title="Ocultar de mi vista"
                    aria-label="Ocultar de mi vista"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-school-body bg-school-background p-3.5 rounded-xl border border-school-border/60 leading-relaxed">
                  {obs.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Double Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-school-heading flex items-center gap-2">
              {step === 1 ? (
                <>
                  <EyeOff className="h-5 w-5 text-school-warning" />
                  ¿Deseas ocultar esta observación?
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-school-error" />
                  Confirmar acción
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-school-muted">
              {step === 1
                ? 'La observación ya no aparecerá en tu lista personal. El registro institucional se conserva.'
                : 'Esta acción ocultará definitivamente esta observación de tu vista de alumno.'}
            </DialogDescription>
          </DialogHeader>

          {observationToDelete && (
            <div className="p-3 bg-school-background rounded-xl border border-school-border text-xs text-school-body">
              <strong className="text-school-heading">{observationToDelete.title}</strong>
              <p className="text-school-muted mt-0.5">
                {new Date(observationToDelete.date || observationToDelete.createdAt).toLocaleDateString('es-ES')} · Docente: {observationToDelete.teacher?.user?.name || 'Docente'}
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant={step === 2 ? 'destructive' : 'default'}
              onClick={handleConfirmHide}
            >
              {step === 1 ? 'Continuar' : 'Sí, Ocultar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
