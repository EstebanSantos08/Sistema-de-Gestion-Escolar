import api from '@/lib/axios';

async function downloadBlob(url: string, filename: string, mimeType: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data as BlobPart], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

export const reportService = {
  downloadCourseExcel(courseId: number, courseCode: string): Promise<void> {
    return downloadBlob(
      `/reports/excel/course/${courseId}`,
      `notas-${courseCode}.xlsx`,
      XLSX_MIME
    );
  },

  downloadStudentExcel(studentId: number, studentCode: string): Promise<void> {
    return downloadBlob(
      `/reports/excel/student/${studentId}`,
      `notas-${studentCode}.xlsx`,
      XLSX_MIME
    );
  },

  downloadAllGradesExcel(period: string): Promise<void> {
    return downloadBlob(
      `/reports/excel/all-grades?period=${period}`,
      `notas-global-${period}.xlsx`,
      XLSX_MIME
    );
  },

  downloadStudentBulletinPdf(studentId: number, studentCode: string): Promise<void> {
    return downloadBlob(
      `/reports/pdf/student/${studentId}`,
      `boletin-${studentCode}.pdf`,
      PDF_MIME
    );
  },

  downloadCoursePdf(courseId: number, courseCode: string): Promise<void> {
    return downloadBlob(
      `/reports/pdf/course/${courseId}`,
      `acta-${courseCode}.pdf`,
      PDF_MIME
    );
  },

  downloadTranscriptPdf(studentId: number, studentCode: string): Promise<void> {
    return downloadBlob(
      `/reports/pdf/transcript/${studentId}`,
      `historial-${studentCode}.pdf`,
      PDF_MIME
    );
  },
};
