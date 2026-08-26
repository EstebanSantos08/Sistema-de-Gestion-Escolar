import { useParams, Link } from 'react-router-dom';
import { FileSpreadsheet, FileText, ClipboardEdit, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCourse } from '@/hooks/useCourses';
import { useCourseStudents } from '@/hooks/useEnrollments';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { GradeBadge } from '@/components/shared/GradeBadge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CourseGradeRow } from '@/types';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : null;

  const { data: course, isLoading: loadingCourse } = useCourse(id);
  const { data: courseData, isLoading: loadingStudents } = useCourseStudents(id);

  const handleDownload = async (type: 'excel' | 'pdf') => {
    if (!course) return;
    try {
      if (type === 'excel') await reportService.downloadCourseExcel(course.id, course.code);
      else await reportService.downloadCoursePdf(course.id, course.code);
    } catch {
      toast.error('Error al generar el reporte');
    }
  };

  const columns: Column<CourseGradeRow>[] = [
    {
      header: 'Estudiante',
      render: (s) => (
        <div>
          <p className="font-medium">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.studentCode}</p>
        </div>
      ),
    },
    {
      header: 'Promedio',
      render: (s) => (
        <span className={`font-semibold ${s.passed ? 'text-green-700' : 'text-red-600'}`}>
          {s.weightedAverage > 0 ? s.weightedAverage.toFixed(2) : '—'}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'Estado',
      render: (s) =>
        s.gradesCount > 0 ? (
          <GradeBadge passed={s.passed} />
        ) : (
          <span className="text-xs text-muted-foreground">Sin notas</span>
        ),
    },
    {
      header: 'Matrícula',
      render: (s) => (
        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
          {s.status === 'active' ? 'Activa' : s.status === 'withdrawn' ? 'Retirada' : 'Completada'}
        </Badge>
      ),
    },
    {
      header: '',
      className: 'w-32 text-right',
      render: () => null,
    },
  ];

  if (loadingCourse) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-muted-foreground">Curso no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/docente/mis-cursos">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
      </div>

      <PageHeader
        title={course.name}
        description={`${course.code} · Período ${course.period} · ${course.credits} créditos`}
      >
        <Button asChild>
          <Link to={`/docente/cursos/${course.id}/notas`}>
            <ClipboardEdit className="mr-2 h-4 w-4" />
            Ingresar calificaciones
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleDownload('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          Acta PDF
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{courseData?.students?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Matriculados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {courseData?.students?.filter((s) => s.passed && s.gradesCount > 0).length ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {courseData?.students?.filter((s) => !s.passed && s.gradesCount > 0).length ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Reprobados</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={(courseData?.students ?? []).map((s) => ({ ...s, id: s.enrollmentId }))}
        isLoading={loadingStudents}
        emptyMessage="No hay estudiantes matriculados"
      />
    </div>
  );
}
