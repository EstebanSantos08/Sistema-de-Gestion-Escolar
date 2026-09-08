import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, EyeOff, AlertTriangle, ShieldAlert, Bell, AlertCircle, Info, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { announcementService } from '@/services/announcement.service';
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
import type { BackendAnnouncement } from '@/types';

const HIDDEN_KEY = 'student_hidden_announcements';

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

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<number[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Real announcements query from /api/announcements scoped to student
  const { data: allAnnouncements = [], isLoading } = useQuery({
    queryKey: ['announcements', user?.id, 'student-announcements'],
    queryFn: () => announcementService.list(),
    enabled: !!user,
  });

  const visibleAnnouncements = useMemo(() => {
    return allAnnouncements
      .filter((ann) => !hiddenIds.includes(ann.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allAnnouncements, hiddenIds]);

  const announcementToDelete = useMemo(() => {
    if (!confirmDeleteId) return null;
    return allAnnouncements.find((a) => a.id === confirmDeleteId) ?? null;
  }, [confirmDeleteId, allAnnouncements]);

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
        title="Comunicados y Avisos"
        description="Circulares institucionales, avisos docentes y notificaciones académicas oficiales"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <Bell className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">
            {visibleAnnouncements.length}
          </p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Avisos Activos</p>
        </Card>
        <Card className="p-4 text-center">
          <Megaphone className="h-5 w-5 mx-auto text-school-primary mb-1" />
          <p className="text-2xl font-bold text-school-primary">{allAnnouncements.length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Total Emitidos</p>
        </Card>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-school-primary mb-3" />
          <p className="text-school-muted font-medium">Cargando circulares oficiales...</p>
        </Card>
      ) : visibleAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay comunicados disponibles</p>
          <p className="text-sm text-school-muted mt-1">
            No tienes avisos institucionales pendientes de lectura.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleAnnouncements.map((ann: BackendAnnouncement) => (
            <Card key={ann.id} className="hover:border-school-accent transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-school-heading text-base">{ann.title}</h3>
                      {ann.course && (
                        <Badge variant="outline" className="text-xs">
                          {ann.course.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-school-muted font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-school-primary" />
                        {new Date(ann.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      {ann.author?.name && (
                        <>
                          <span>·</span>
                          <span>Autor: {ann.author.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(ann.id)}
                    className="text-school-muted hover:text-school-error hover:bg-school-error/10 shrink-0"
                    title="Ocultar de mi vista"
                    aria-label="Ocultar de mi vista"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-school-body bg-school-background p-3.5 rounded-xl border border-school-border/60 leading-relaxed">
                  {ann.content}
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
                  ¿Deseas ocultar este comunicado?
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
                ? 'El aviso ya no aparecerá en tu lista personal. El comunicado institucional se conserva.'
                : 'Esta acción ocultará definitivamente este comunicado de tu vista de alumno.'}
            </DialogDescription>
          </DialogHeader>

          {announcementToDelete && (
            <div className="p-3 bg-school-background rounded-xl border border-school-border text-xs text-school-body">
              <strong className="text-school-heading">{announcementToDelete.title}</strong>
              <p className="text-school-muted mt-0.5">{announcementToDelete.content.slice(0, 80)}...</p>
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
