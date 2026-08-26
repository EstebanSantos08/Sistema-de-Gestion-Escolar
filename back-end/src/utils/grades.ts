export function calculateWeightedAverage(grades: { score: number; weight: number }[]): number {
  if (grades.length === 0) return 0;

  const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);

  // Si los pesos suman ~1, usar promedio ponderado
  if (Math.abs(totalWeight - 1) < 0.01) {
    return Number(
      grades.reduce((sum, g) => sum + g.score * g.weight, 0).toFixed(2)
    );
  }

  // Si los pesos no suman 1, usar promedio simple
  return Number(
    (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
  );
}

export function isPassed(average: number, passGrade?: number): boolean {
  const pass = passGrade ?? Number(process.env.GRADE_PASS ?? 7);
  return average >= pass;
}

export function getLetterGrade(score: number): string {
  if (score >= 9) return 'A';
  if (score >= 8) return 'B';
  if (score >= 7) return 'C';
  if (score >= 5) return 'D';
  return 'F';
}

export function getGradeLabel(gradeType: string): string {
  const labels: Record<string, string> = {
    parcial1: 'Parcial 1',
    parcial2: 'Parcial 2',
    examen_final: 'Examen Final',
    tarea: 'Tarea',
    proyecto: 'Proyecto',
  };
  return labels[gradeType] ?? gradeType;
}
