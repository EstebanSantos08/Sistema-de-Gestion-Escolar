import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Eye, EyeOff, AlertTriangle, CheckCircle2, AlertCircle, Info, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { teacherModuleService } from '@/services/teacherModule.service';
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
import type { ObservationType } from '@/types';

const HIDDEN_KEY = 'student_hidden_observations';

function getHiddenIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addHiddenId(id: string): void {
  const ids = getHiddenIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
  }
}

export default function StudentObservationsPage() {
  const { user } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<string[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const allObservations = useMemo(() => {
    const all = teacherModuleService.getObservations();
    return all.filter((obs) => {
      const nameMatch = user?.name && obs.studentName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase());
      const idMatch = obs.studentId === (user?.id ?? 0);
      if (!nameMatch && !idMatch) return false;
      if (obs.visibility === 'SOLO_DOCENTE') return false;
      return true;
    });
  }, [user]);

  const visibleObservations = useMemo(() => {
    return allObservations.filter((obs) => !hiddenIds.includes(obs.id));
  }, [allObservations, hiddenIds]);

  const observationToDelete = useMemo(() => {
    if (!confirmDeleteId) return null;
    return allObservations.find((o) => o.id === confirmDeleteId) ?? null;
  }, [confirmDeleteId, allObservations]);

  const openDeleteDialog = useCallback((id: string) => {
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
          <p className="text-2xl font-bold text-school-success">{visibleObservations.filter((o) => o.type === 'positiva').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Positivas</p>
        </Card>
        <Card className="p-4 text-center">
          <Info className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{visibleObservations.filter((o) => o.type === 'recomendacion').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Recomendaciones</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">{visibleObservations.filter((o) => o.type === 'atencion').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Atención</p>
        </Card>
      </div>

      {/* Observations List */}
      {visibleObservations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No tienes observaciones visibles</p>
          <p className="text-sm text-school-muted mt-1">No hay observaciones registradas o has ocultado las existentes.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleObservations.map((obs) => (
            <Card key={obs.id} className="hover:border-school-accent transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-school-heading text-base">{obs.title}</h3>
                      <Badge
                        variant={
                          obs.type === 'positiva' ? 'success' :
                          obs.type === 'atencion' ? 'destructive' : 'secondary'
                        }
                      >
                        {obs.type === 'positiva' ? 'Positiva' : obs.type === 'atencion' ? 'Atención' : 'Recomendación'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-school-muted font-medium flex-wrap">
                      <span>📅 {obs.date}</span>
                      <span>·</span>
                      <span>📚 {obs.courseName}</span>
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
                  {obs.detail}
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
              <p className="text-school-muted mt-0.5">{observationToDelete.date} · {observationToDelete.courseName}</p>
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
