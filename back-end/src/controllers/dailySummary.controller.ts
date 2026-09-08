import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Teacher, Course, Enrollment, Activity, Submission, Student, User, Attendance, Observation, Announcement } from '../models/index';
import { getTeacherProfile } from '../services/scope.service';

// ── GET /api/teachers/me/daily-summary ───────────────────────────────────────

export const getTeacherDailySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await getTeacherProfile(req.user!.id);
    if (!teacher) {
      res.status(404).json({ success: false, error: 'Perfil de docente no encontrado' });
      return;
    }

    // ── Filters ────────────────────────────────────────────────────────────────
    const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const courseIdParam = req.query.courseId ? Number(req.query.courseId) : undefined;
    const period = (req.query.period as string) || process.env.ACTIVE_PERIOD || '2026-I';

    // ── Validate date ──────────────────────────────────────────────────────────
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ success: false, error: 'Fecha inválida' });
      return;
    }
    const dateStr = dateParam; // YYYY-MM-DD

    // ── Find teacher's courses (scoped) ────────────────────────────────────────
    const courseWhere: Record<string, unknown> = { teacherId: teacher.id, period, active: true };
    if (courseIdParam) courseWhere.id = courseIdParam;

    const teacherCourses = await Course.findAll({
      where: courseWhere,
      include: [
        {
          model: Enrollment, as: 'enrollments',
          where: { status: 'active' },
          required: false,
          include: [
            { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
          ],
        },
      ],
    });

    const courseIds = teacherCourses.map(c => c.id);

    if (courseIds.length === 0) {
      res.json({
        success: true,
        data: {
          date: dateStr,
          period,
          teacher: { id: teacher.id },
          courses: [],
          attendance: [],
          activities: [],
          observations: [],
          announcements: [],
          summary: { totalStudents: 0, presentToday: 0, absentToday: 0, activitiesToday: 0, observationsToday: 0 },
        },
      });
      return;
    }

    // ── Parallel queries (teacher-scoped) ──────────────────────────────────────
    const [attendances, activities, observations, announcements] = await Promise.all([
      // Attendance for the target date across teacher's courses
      Attendance.findAll({
        where: { courseId: { [Op.in]: courseIds }, date: dateStr },
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
        ],
        order: [['courseId', 'ASC'], ['studentId', 'ASC']],
      }),

      // Activities in teacher's courses (optionally filtered to target date due date)
      Activity.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          ...(req.query.activitiesDate ? { dueDate: dateStr } : {}),
        },
        include: [
          {
            model: Submission, as: 'submissions', required: false,
            attributes: ['id', 'studentId', 'status', 'score', 'submittedAt'],
          },
        ],
        order: [['createdAt', 'DESC']],
      }),

      // Observations written by this teacher today
      Observation.findAll({
        where: {
          teacherId: teacher.id,
          date: dateStr,
          ...(courseIdParam ? {} : {}), // observations don't have courseId in model – filter by teacher
        },
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
        ],
        order: [['createdAt', 'DESC']],
      }),

      // Announcements authored by this teacher
      Announcement.findAll({
        where: {
          authorId: req.user!.id,
          ...(courseIdParam ? { courseId: courseIdParam } : { courseId: { [Op.in]: [...courseIds, null] } }),
          createdAt: {
            [Op.gte]: new Date(`${dateStr}T00:00:00.000Z`),
            [Op.lte]: new Date(`${dateStr}T23:59:59.999Z`),
          },
        },
        order: [['createdAt', 'DESC']],
      }),
    ]);

    // ── Shape attendance summary per course ────────────────────────────────────
    const attendanceByCourse = courseIds.map(courseId => {
      const courseAttendances = attendances.filter(a => a.courseId === courseId);
      return {
        courseId,
        date: dateStr,
        records: courseAttendances.map(a => ({
          studentId: a.studentId,
          studentName: (a.student as { user?: { name: string } } | undefined)?.user?.name,
          status: a.status,
          remarks: a.remarks,
        })),
        summary: {
          present: courseAttendances.filter(a => a.status === 'PRESENT').length,
          absent: courseAttendances.filter(a => a.status === 'ABSENT').length,
          late: courseAttendances.filter(a => a.status === 'LATE').length,
          excused: courseAttendances.filter(a => a.status === 'EXCUSED').length,
          total: courseAttendances.length,
        },
      };
    });

    // ── Shape activities with submission stats ─────────────────────────────────
    const activitySummary = activities.map(activity => {
      const subs = (activity.submissions as Array<{ id: number; studentId: number; status: string; score: number | null; submittedAt: Date | null }>) ?? [];
      return {
        id: activity.id,
        courseId: activity.courseId,
        title: activity.title,
        type: activity.type,
        status: activity.status,
        dueDate: activity.dueDate,
        maxScore: activity.maxScore,
        submissions: {
          total: subs.length,
          graded: subs.filter(s => s.score !== null).length,
          pending: subs.filter(s => s.status === 'pendiente' || s.status === 'en_proceso').length,
        },
      };
    });

    // ── Shape observations ─────────────────────────────────────────────────────
    const observationSummary = observations.map(obs => ({
      id: obs.id,
      studentId: obs.studentId,
      studentName: (obs.student as { user?: { name: string } } | undefined)?.user?.name,
      title: obs.title,
      type: obs.type,
      visibility: obs.visibility,
      date: obs.date,
    }));

    // ── Shape announcements ────────────────────────────────────────────────────
    const announcementSummary = announcements.map(ann => ({
      id: ann.id,
      title: ann.title,
      targetRole: ann.targetRole,
      courseId: ann.courseId,
      createdAt: ann.createdAt,
    }));

    // ── Global summary counts ──────────────────────────────────────────────────
    const allEnrollments = teacherCourses.flatMap(c => (c.enrollments as Enrollment[]) ?? []);
    const totalStudents = new Set(allEnrollments.map(e => e.studentId)).size;
    const presentToday = attendances.filter(a => a.status === 'PRESENT').length;
    const absentToday = attendances.filter(a => a.status === 'ABSENT').length;

    res.json({
      success: true,
      data: {
        date: dateStr,
        period,
        teacher: {
          id: teacher.id,
          userId: teacher.userId,
        },
        courses: teacherCourses.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          enrolledCount: ((c.enrollments as Enrollment[]) ?? []).length,
        })),
        attendance: attendanceByCourse,
        activities: activitySummary,
        observations: observationSummary,
        announcements: announcementSummary,
        summary: {
          totalStudents,
          presentToday,
          absentToday,
          activitiesToday: activitySummary.length,
          observationsToday: observationSummary.length,
          announcementsToday: announcementSummary.length,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener resumen diario' });
  }
};
