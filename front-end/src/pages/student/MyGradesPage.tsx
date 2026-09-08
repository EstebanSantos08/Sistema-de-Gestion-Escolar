import { Link } from 'react-router-dom';
import { FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyGrades } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const gradeTypeLabel: Record<string, string> = {
  parcial1: 'Parcial 1',
  parcial2: 'Parcial 2',
  examen_final: 'Examen Final',
  tarea: 'Tarea',
  proyecto: 'Proyecto',
};

export default function MyGradesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyGrades();
  const courses = data?.courses ?? [];

  const handleDownloadBuletin = async () => {
    if (!user) return;
    try {
      await reportService.downloadStudentBulletinPdf(user.id, 'mi-boletin');
    } catch {
      toast.error('Error al generar el boletín');
    }
  };

  if (isLoading) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 py-20 text-school-muted text-sm">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-school-primary border-t-transparent" />
        <span>Cargando calificaciones...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Estudiante" title="Mis Calificaciones" description="Registro académico" />
        <Card className="p-8 text-center border-school-error/30 bg-school-error/5">
          <div className="max-w-md mx-auto space-y-3">
            <AlertCircle className="h-8 w-8 text-school-error mx-auto" />
            <h3 className="text-base font-semibold text-school-heading">No se pudieron cargar las calificaciones</h3>
            <p className="text-sm text-school-muted">Comprueba tu conexión e inténtalo de nuevo.</p>
            <Button variant="outline" onClick={() => void refetch()} className="mt-2">
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-school-body font-medium hover:bg-school-subtle">
          <Link to="/estudiante/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1 text-school-primary" /> Volver a Mis Cursos
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Estudiante"
        title="Mis Calificaciones"
        description={`Registro y desglose de calificaciones${data?.period ? ` · Período ${data.period}` : ''}`}
      >
        <Button variant="outline" onClick={handleDownloadBuletin} className="gap-2">
          <FileText className="h-4 w-4 text-school-primary" />
          Descargar Boletín PDF
        </Button>
      </PageHeader>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-school-muted text-sm">No tienes calificaciones registradas en este período.</p>
        </Card>
      ) : (
        <>
          <Accordion type="multiple" className="space-y-3">
            {courses.map((c) => (
              <AccordionItem
                key={c.courseId}
                value={String(c.courseId)}
                className="rounded-2xl border border-school-border bg-white px-5 shadow-xs overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full pr-4 text-left">
                    <div>
                      <p className="font-bold text-base text-school-heading">{c.courseName}</p>
                      <p className="text-xs text-school-muted">{c.teacherName || 'Docente asignado'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.grades.length > 0 ? (
                        <>
                          <span className={`font-bold text-lg ${c.passed ? 'text-school-success' : 'text-school-error'}`}>
                            {c.weightedAverage.toFixed(2)}
                          </span>
                          <GradeBadge passed={c.passed} />
                        </>
                      ) : (
                        <span className="text-xs text-school-muted">Sin notas</span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-1 pb-4">
                  {c.grades.length === 0 ? (
                    <p className="text-sm text-school-muted py-2">
                      Aún no hay calificaciones registradas para esta materia.
                    </p>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="overflow-x-auto rounded-xl border border-school-border">
                        <Table>
                          <TableHeader className="bg-school-background">
                            <TableRow>
                              <TableHead className="font-semibold text-school-heading">Tipo de Evaluación</TableHead>
                              <TableHead className="tabular-nums text-center font-semibold text-school-heading">Nota</TableHead>
                              <TableHead className="tabular-nums text-center font-semibold text-school-heading">Peso</TableHead>
                              <TableHead className="tabular-nums text-center font-semibold text-school-heading">Aporte</TableHead>
                              <TableHead className="font-semibold text-school-heading">Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-school-border">
                            {c.grades.map((g, gi) => (
                              <TableRow key={gi} className="hover:bg-school-background/40">
                                <TableCell className="font-medium text-school-heading">
                                  {gradeTypeLabel[g.gradeType] ?? g.gradeType}
                                </TableCell>
                                <TableCell className="tabular-nums text-center font-bold text-school-heading">
                                  {g.score.toFixed(2)}
                                </TableCell>
                                <TableCell className="tabular-nums text-center text-school-muted">
                                  {(g.weight * 100).toFixed(0)}%
                                </TableCell>
                                <TableCell className="tabular-nums text-center font-semibold text-school-primary">
                                  {(g.score * g.weight).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-school-muted text-xs">
                                  {(g as { comments?: string }).comments ?? '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-school-muted">Promedio Final Ponderado</span>
                          <span className={c.passed ? 'text-school-success' : 'text-school-error'}>
                            {c.weightedAverage.toFixed(2)} / 10
                          </span>
                        </div>
                        <Progress
                          value={(c.weightedAverage / 10) * 100}
                          className={c.passed ? '[&>div]:bg-school-success' : '[&>div]:bg-school-error'}
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* General average card */}
          {data && data.generalAverage > 0 && (
            <Card className="bg-school-subtle/50 border-school-border">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold text-school-heading text-base">
                  Promedio General del Período
                </span>
                <span className="text-2xl font-bold text-school-primary">
                  {data.generalAverage.toFixed(2)} / 10
                </span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
