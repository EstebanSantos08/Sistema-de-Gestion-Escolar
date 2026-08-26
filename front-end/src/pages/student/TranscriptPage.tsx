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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Período {pd.period}</CardTitle>
          {pd.generalAverage > 0 && (
            <span className="text-sm font-medium">
              Promedio: <strong>{pd.generalAverage.toFixed(2)}</strong>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Materia</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead className="text-center">Promedio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Matrícula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pd.courses.map((c) => (
              <TableRow key={c.courseId}>
                <TableCell>
                  <p className="font-medium">{c.courseName}</p>
                  <p className="text-xs text-muted-foreground">{c.courseCode}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.teacherName}</TableCell>
                <TableCell className="text-center font-semibold">
                  {c.grades.length > 0 ? c.weightedAverage.toFixed(2) : '—'}
                </TableCell>
                <TableCell>
                  {c.grades.length > 0 ? (
                    <GradeBadge passed={c.passed} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin notas</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.enrollmentStatus === 'active'
                        ? 'default'
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
      <PageHeader title="Historial Académico" description="Registro completo de todos los períodos cursados">
        <Button variant="outline" onClick={handleDownload}>
          <FileText className="mr-2 h-4 w-4" />
          Descargar PDF
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
