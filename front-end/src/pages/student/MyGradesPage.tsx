import { FileText } from 'lucide-react';
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
  const { data, isLoading } = useMyGrades();
  const courses = data?.courses ?? [];

  const handleDownloadBuletin = async () => {
    if (!user) return;
    try {
      // student id is fetched from profile — for student role the studentProfile id
      // We use user.id as a proxy; backend resolves by token
      await reportService.downloadStudentBulletinPdf(user.id, 'mi-boletin');
    } catch {
      toast.error('Error al generar el boletín');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Mis Calificaciones — Período ${data?.period ?? '2026-I'}`}
        description="Desglose de notas por materia"
      >
        <Button variant="outline" onClick={handleDownloadBuletin}>
          <FileText className="mr-2 h-4 w-4" />
          Descargar boletín PDF
        </Button>
      </PageHeader>

      {courses.length === 0 ? (
        <p className="text-muted-foreground">No tienes calificaciones registradas.</p>
      ) : (
        <>
          <Accordion type="multiple" className="space-y-2">
            {courses.map((c) => (
              <AccordionItem
                key={c.courseId}
                value={String(c.courseId)}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="font-semibold">{c.courseName}</p>
                      <p className="text-xs text-muted-foreground">{c.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.grades.length > 0 ? (
                        <>
                          <span className={`font-bold text-lg ${c.passed ? 'text-green-700' : 'text-red-600'}`}>
                            {c.weightedAverage.toFixed(2)}
                          </span>
                          <GradeBadge passed={c.passed} />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin notas</span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  {c.grades.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Aún no hay calificaciones registradas para esta materia.
                    </p>
                  ) : (
                    <div className="space-y-4 pb-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-center">Nota</TableHead>
                            <TableHead className="text-center">Peso</TableHead>
                            <TableHead className="text-center">Aporte</TableHead>
                            <TableHead>Observaciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {c.grades.map((g, gi) => (
                            <TableRow key={gi}>
                              <TableCell>{gradeTypeLabel[g.gradeType] ?? g.gradeType}</TableCell>
                              <TableCell className="text-center font-semibold">
                                {g.score.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {(g.weight * 100).toFixed(0)}%
                              </TableCell>
                              <TableCell className="text-center">
                                {(g.score * g.weight).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {(g as { comments?: string }).comments ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Promedio final</span>
                          <span className={`font-bold ${c.passed ? 'text-green-700' : 'text-red-600'}`}>
                            {c.weightedAverage.toFixed(2)} / 10
                          </span>
                        </div>
                        <Progress
                          value={(c.weightedAverage / 10) * 100}
                          className={c.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* General average footer */}
          {data && data.generalAverage > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-semibold">Promedio general del período</span>
                <span className="text-2xl font-bold text-primary">
                  {data.generalAverage.toFixed(2)}
                </span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
