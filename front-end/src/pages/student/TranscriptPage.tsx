import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/services/student.service';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StudentGradesResponse } from '@/types';

const PERIODS = ['2026-I', '2025-II', '2025-I'];

function usePeriodGrades(period: string) {
  return useQuery<StudentGradesResponse>({
    queryKey: ['my-grades', period],
    queryFn: () => studentService.getMyGrades(period),
    retry: false,
  });
}

function PeriodCard({ period }: { period: string }) {
  const { data: pd, isLoading } = usePeriodGrades(period);
  if (isLoading) return null;
  if (!pd || pd.courses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="border-b border-school-border/70 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold text-school-heading">
          Período {pd.period}
        </CardTitle>
        {pd.generalAverage > 0 && (
          <span className="text-sm font-medium text-school-body">
            Promedio: <strong className="text-ink-turquoise font-bold">{pd.generalAverage.toFixed(2)}</strong>
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-school-background">
              <TableRow>
                <TableHead className="font-semibold text-school-heading">Materia</TableHead>
                <TableHead className="font-semibold text-school-heading">Docente</TableHead>
                <TableHead className="text-center font-semibold text-school-heading">Promedio</TableHead>
                <TableHead className="font-semibold text-school-heading">Estado</TableHead>
                <TableHead className="font-semibold text-school-heading">Matrícula</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-school-border">
              {pd.courses.map((c) => (
                <TableRow key={c.courseId} className="hover:bg-school-background/40">
                  <TableCell>
                    <p className="font-semibold text-school-heading text-sm">{c.courseName}</p>
                    <p className="text-xs text-school-muted-readable">{c.courseCode}</p>
                  </TableCell>
                  <TableCell className="text-sm text-school-body">{c.teacherName || '—'}</TableCell>
                  <TableCell className="text-center font-bold text-school-heading">
                    {c.grades.length > 0 ? c.weightedAverage.toFixed(2) : '—'}
                  </TableCell>
                  <TableCell>
                    {c.grades.length > 0 ? (
                      <GradeBadge passed={c.passed} />
                    ) : (
                      <span className="text-xs text-school-muted-readable">Sin notas</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.enrollmentStatus === 'active'
                          ? 'success'
                          : c.enrollmentStatus === 'completed'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {c.enrollmentStatus === 'active'
                        ? 'Activa'
                        : c.enrollmentStatus === 'completed'
                          ? 'Completada'
                          : 'Retirada'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TranscriptPage() {
  const { user } = useAuth();

  const handleDownload = async () => {
    if (!user) return;
    try {
      await reportService.downloadTranscriptPdf(user.id, 'historial');
    } catch {
      toast.error('Error al generar el historial');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estudiante"
        title="Historial Académico"
        description="Registro histórico completo de todos los períodos lectivos cursados"
      >
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <FileText className="h-4 w-4 text-ink-turquoise" />
          Descargar Historial PDF
        </Button>
      </PageHeader>

      <div className="space-y-6">
        {PERIODS.map((p) => (
          <PeriodCard key={p} period={p} />
        ))}
      </div>
    </div>
  );
}
