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

const TYPE_CONFIG: Record<ObservationType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  positiva: { label: 'Positiva', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  recomendacion: { label: 'Recomendación', icon: <Info className="h-3.5 w-3.5" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  atencion: { label: 'Atención', icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export default function StudentObservationsPage() {
  const { user } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<string[]>(getHiddenIds);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Get observations for the logged-in student, excluding SOLO_DOCENTE visibility
  const allObservations = useMemo(() => {
    const all = teacherModuleService.getObservations();
    return all.filter((obs) => {
      // Filter by student match (name-based for seed data compatibility)
      const nameMatch = user?.name && obs.studentName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase());
      const idMatch = obs.studentId === (user?.id ?? 0);
      if (!nameMatch && !idMatch) return false;
      // Filter out SOLO_DOCENTE visibility
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
    // Step 2: actually hide it
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
        title="Mis Observaciones"
        description="Observaciones registradas por tus docentes (solo lectura)"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-emerald-100">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-black text-emerald-700">{visibleObservations.filter((o) => o.type === 'positiva').length}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Positivas</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-amber-100">
          <CardContent className="p-4 text-center">
            <Info className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-black text-amber-700">{visibleObservations.filter((o) => o.type === 'recomendacion').length}</p>
            <p className="text-[10px] font-bold text-amber-500 uppercase">Recomendaciones</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/80 backdrop-blur-md rounded-2xl shadow-lg border border-rose-100">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-600 mb-1" />
            <p className="text-2xl font-black text-rose-700">{visibleObservations.filter((o) => o.type === 'atencion').length}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase">Atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Observations List */}
      {visibleObservations.length === 0 ? (
        <Card className="p-8 text-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-slate-600 text-sm">No tienes observaciones visibles</p>
          <p className="text-xs text-slate-400 mt-1">No hay observaciones registradas o ya las has ocultado todas.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleObservations.map((obs) => {
            const cfg = TYPE_CONFIG[obs.type];
            return (
              <Card key={obs.id} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 overflow-hidden hover:shadow-xl transition-all">
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-800 text-base">{obs.title}</h3>
                        <Badge className={`${cfg.bg} ${cfg.color} border font-bold text-[10px] gap-1`}>
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                        <span>📅 {obs.date}</span>
                        <span>📚 {obs.courseName}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {obs.visibility === 'SOLO_ESTUDIANTE' ? 'Solo tú' : 'Estudiante y padres'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(obs.id)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                      title="Ocultar de mi vista"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Detail */}
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {obs.detail}
                  </p>
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
                  ¿Ocultar esta observación?
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
                  La observación <strong>"{observationToDelete?.title}"</strong> se ocultará de tu vista personal.
                  Esta acción <strong>no la elimina</strong> del sistema ni de la vista del docente.
                </>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 font-bold flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Esta es la confirmación final. Una vez oculta, ya no verás esta observación en tu listado. El docente y la base de datos la conservarán intacta.</span>
                  </div>
                  <p className="font-extrabold text-slate-700">
                    ¿Deseas confirmar la eliminación de <span className="text-rose-600">"{observationToDelete?.title}"</span> de tu vista?
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
