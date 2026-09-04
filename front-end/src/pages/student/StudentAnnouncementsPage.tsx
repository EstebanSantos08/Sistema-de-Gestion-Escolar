import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, EyeOff, AlertTriangle, ShieldAlert, Trash2, Bell, AlertCircle, Info } from 'lucide-react';
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

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  normal: { label: 'Normal', icon: <Info className="h-3.5 w-3.5" />, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  importante: { label: 'Importante', icon: <Bell className="h-3.5 w-3.5" />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  urgente: { label: 'Urgente', icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export default function StudentAnnouncementsPage() {
  const [hiddenIds, setHiddenIds] = useState<string[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const allAnnouncements = teacherModuleService.getAnnouncements();

  const visibleAnnouncements = useMemo(() => {
    return allAnnouncements
      .filter((ann) => !hiddenIds.includes(ann.id))
      .sort((a, b) => {
        // Sort: urgente first, then importante, then normal
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
    // Step 2: actually hide
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
      <PageHeader
        title="Comunicados"
        description="Avisos y noticias publicados por los docentes y la institución"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-sky-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-sky-100">
          <CardContent className="p-4 text-center">
            <Info className="h-5 w-5 mx-auto text-sky-600 mb-1" />
            <p className="text-2xl font-black text-sky-700">{visibleAnnouncements.filter((a) => a.priority === 'normal').length}</p>
            <p className="text-[10px] font-bold text-sky-500 uppercase">Normales</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-amber-100">
          <CardContent className="p-4 text-center">
            <Bell className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-black text-amber-700">{visibleAnnouncements.filter((a) => a.priority === 'importante').length}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase">Importantes</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-rose-100">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-600 mb-1" />
            <p className="text-2xl font-black text-rose-700">{visibleAnnouncements.filter((a) => a.priority === 'urgente').length}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      {visibleAnnouncements.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <Megaphone className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-600 text-sm">No hay comunicados visibles</p>
          <p className="text-xs text-slate-400 mt-1">No hay comunicados publicados o ya los has ocultado todos.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleAnnouncements.map((ann) => {
            const cfg = PRIORITY_CONFIG[ann.priority];
            return (
              <Card key={ann.id} className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all ${ann.priority === 'urgente' ? 'border-rose-200 ring-2 ring-rose-100' : ann.priority === 'importante' ? 'border-amber-200' : 'border-white/60'}`}>
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Megaphone className={`h-4 w-4 ${cfg.color} shrink-0`} />
                        <h3 className="font-black text-slate-800 text-base">{ann.title}</h3>
                        <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} border font-bold text-[10px] gap-1`}>
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                        <span>📅 {ann.publishDate}</span>
                        <span>✍️ {ann.authorName}</span>
                        {ann.courseName && <span>📚 {ann.courseName}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(ann.id)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                      title="Ocultar de mi vista"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className={`text-xs p-4 rounded-xl border leading-relaxed ${cfg.bg} ${cfg.border} text-slate-700`}>
                    {ann.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Double Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              {step === 1 ? (
                <>
                  <EyeOff className="h-5 w-5 text-amber-500" />
                  ¿Ocultar este comunicado?
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  Confirmar eliminación de vista
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-2">
              {step === 1 ? (
                <>
                  El comunicado <strong>"{announcementToDelete?.title}"</strong> se ocultará de tu vista personal.
                  Esta acción <strong>no lo elimina</strong> del sistema ni de la vista del docente.
                </>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 font-bold flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Esta es la confirmación final. Una vez oculto, ya no verás este comunicado en tu listado. El docente y la base de datos lo conservarán intacto.</span>
                  </div>
                  <p className="font-extrabold text-slate-700">
                    ¿Deseas confirmar la eliminación de <span className="text-rose-600">"{announcementToDelete?.title}"</span> de tu vista?
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmHide}
              className={step === 1
                ? 'bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-md'
                : 'bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md'
              }
            >
              {step === 1 ? (
                <>
                  <EyeOff className="mr-1.5 h-4 w-4" />
                  Sí, ocultar
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Confirmar Eliminación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm" className="text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
          <Link to="/estudiante">
            <ArrowLeft className="h-4 w-4 mr-1.5 text-[#008BC1]" /> Volver al Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
