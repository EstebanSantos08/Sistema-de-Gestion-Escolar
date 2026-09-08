import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, EyeOff, AlertTriangle, ShieldAlert, Trash2, Bell, AlertCircle, Info, Calendar, BookOpen } from 'lucide-react';
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
import type { AnnouncementPriority } from '@/types';

const HIDDEN_KEY = 'student_hidden_announcements';

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

export default function StudentAnnouncementsPage() {
  const [hiddenIds, setHiddenIds] = useState<string[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const allAnnouncements = teacherModuleService.getAnnouncements();

  const visibleAnnouncements = useMemo(() => {
    return allAnnouncements
      .filter((ann) => !hiddenIds.includes(ann.id))
      .sort((a, b) => {
        const order: Record<string, number> = { urgente: 0, importante: 1, normal: 2 };
        const diff = (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
        if (diff !== 0) return diff;
        return b.publishDate.localeCompare(a.publishDate);
      });
  }, [allAnnouncements, hiddenIds]);

  const announcementToDelete = useMemo(() => {
    if (!confirmDeleteId) return null;
    return allAnnouncements.find((a) => a.id === confirmDeleteId) ?? null;
  }, [confirmDeleteId, allAnnouncements]);

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

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgente':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Urgente
          </Badge>
        );
      case 'importante':
        return (
          <Badge variant="warning" className="gap-1">
            <Bell className="h-3 w-3" /> Importante
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" /> Normal
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
        title="Comunicados y Circulares"
        description="Avisos oficiales y noticias publicadas por los docentes y la institución"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Info className="h-5 w-5 mx-auto text-school-blue mb-1" />
          <p className="text-2xl font-bold text-school-blue">{visibleAnnouncements.filter((a) => a.priority === 'normal').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Informativos</p>
        </Card>
        <Card className="p-4 text-center">
          <Bell className="h-5 w-5 mx-auto text-school-warning mb-1" />
          <p className="text-2xl font-bold text-school-warning">{visibleAnnouncements.filter((a) => a.priority === 'importante').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Importantes</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-school-error mb-1" />
          <p className="text-2xl font-bold text-school-error">{visibleAnnouncements.filter((a) => a.priority === 'urgente').length}</p>
          <p className="text-xs text-school-muted uppercase font-medium tracking-wider">Urgentes</p>
        </Card>
      </div>

      {/* Announcements List */}
      {visibleAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-10 w-10 mx-auto text-school-muted mb-2" />
          <p className="font-semibold text-school-heading text-base">No hay comunicados visibles</p>
          <p className="text-sm text-school-muted mt-1">No hay comunicados publicados o los has ocultado de tu lista personal.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleAnnouncements.map((ann) => (
            <Card key={ann.id} className="hover:border-school-accent transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-school-heading text-base">{ann.title}</h3>
                      {getPriorityBadge(ann.priority)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-school-muted font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {ann.publishDate}
                      </span>
                      <span>·</span>
                      <span>Docente: {ann.authorName}</span>
                      {ann.courseName && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-school-primary" /> {ann.courseName}
                          </span>
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

                <div className="text-sm text-school-body bg-school-background p-4 rounded-xl border border-school-border/60 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </div>
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
              {step === 1 ? (
                <>
                  El comunicado <strong>"{announcementToDelete?.title}"</strong> se ocultará únicamente de tu vista. El comunicado institucional se mantiene intacto.
                </>
              ) : (
                <>
                  Esta es la confirmación final para no mostrar <strong>"{announcementToDelete?.title}"</strong> en tu panel de alumno.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

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
