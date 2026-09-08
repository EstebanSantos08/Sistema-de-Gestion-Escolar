/**
 * Scope authorization helpers.
 *
 * All authorization checks resolve through the DB – never trust user-supplied
 * role or entity identifiers from request body.
 */

import { Teacher, Student, Course, Enrollment, Activity, Submission } from '../models/index';

// ── Teacher scope ─────────────────────────────────────────────────────────────

/**
 * Return the Teacher profile for an authenticated user.
 * Returns null if the user is not a teacher.
 */
export async function getTeacherProfile(userId: number): Promise<Teacher | null> {
  return Teacher.findOne({ where: { userId }, attributes: ['id', 'userId'] });
}

/**
 * Assert that a teacher owns a course.
 * Returns the course if authorized, throws 403-equivalent null otherwise.
 */
export async function requireTeacherOwnsCourse(
  teacherId: number,
  courseId: number
): Promise<Course | null> {
  const course = await Course.findOne({
    where: { id: courseId, teacherId, active: true },
  });
  return course; // null → caller should return 403
}

/**
 * Assert that a course has an active enrollment for a student.
 * Used to authorize teacher's access to a student's submission in their course.
 */
export async function requireStudentEnrolledInCourse(
  studentId: number,
  courseId: number
): Promise<Enrollment | null> {
  return Enrollment.findOne({
    where: { studentId, courseId, status: 'active' },
  });
}

/**
 * Full chain: teacher → course → activity.
 * Returns the activity if all checks pass.
 */
export async function requireTeacherOwnsActivity(
  teacherId: number,
  activityId: number
): Promise<Activity | null> {
  const activity = await Activity.findByPk(activityId, {
    include: [{ model: Course, as: 'course', where: { teacherId }, required: true }],
  });
  return activity ?? null;
}

/**
 * Full chain: teacher → course → activity → submission.
 * Returns the submission if all checks pass.
 */
export async function requireTeacherCanGradeSubmission(
  teacherId: number,
  submissionId: number
): Promise<Submission | null> {
  const submission = await Submission.findByPk(submissionId, {
    include: [
      {
        model: Activity,
        as: 'activity',
        required: true,
        include: [
          { model: Course, as: 'course', where: { teacherId }, required: true },
        ],
      },
    ],
  });
  return submission ?? null;
}

// ── Student scope ─────────────────────────────────────────────────────────────

/**
 * Return the Student profile for an authenticated user.
 * Returns null if user is not a student.
 */
export async function getStudentProfile(userId: number): Promise<Student | null> {
  return Student.findOne({ where: { userId }, attributes: ['id', 'userId'] });
}

/**
 * Assert that the student is enrolled in the course that owns this activity.
 */
export async function requireStudentCanAccessActivity(
  studentId: number,
  activityId: number
): Promise<Activity | null> {
  const activity = await Activity.findByPk(activityId);
  if (!activity) return null;

  const enrollment = await Enrollment.findOne({
    where: { studentId, courseId: activity.courseId, status: 'active' },
  });
  return enrollment ? activity : null;
}

/**
 * Assert that a submission belongs to the requesting student.
 */
export async function requireStudentOwnsSubmission(
  studentId: number,
  submissionId: number
): Promise<Submission | null> {
  return Submission.findOne({
    where: { id: submissionId, studentId },
  });
}

/**
 * Assert that the student is enrolled in the given course (active).
 */
export async function requireStudentEnrolled(
  studentId: number,
  courseId: number
): Promise<Enrollment | null> {
  return Enrollment.findOne({
    where: { studentId, courseId, status: 'active' },
  });
}
