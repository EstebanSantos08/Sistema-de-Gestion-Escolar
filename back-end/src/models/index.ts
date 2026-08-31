import User from './User';
import Student from './Student';
import Teacher from './Teacher';
import Course from './Course';
import Enrollment from './Enrollment';
import Grade from './Grade';
import Announcement from './Announcement';
import Observation from './Observation';
import Activity from './Activity';
import Attendance from './Attendance';
import AuditLog from './AuditLog';
import Report from './Report';
import Representative from './Representative';
import Submission from './Submission';
import Evidence from './Evidence';
import Comment from './Comment';
import Notification from './Notification';

// User ↔ Student (1:1)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Teacher (1:1)
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Representative (1:1)
User.hasOne(Representative, { foreignKey: 'userId', as: 'representativeProfile' });
Representative.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Teacher ↔ Course (1:N)
Teacher.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

// Student ↔ Enrollment (1:N)
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Course ↔ Enrollment (1:N)
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Enrollment ↔ Grade (1:N)
Enrollment.hasMany(Grade, { foreignKey: 'enrollmentId', as: 'grades' });
Grade.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

// User ↔ Grade (quien calificó)
User.hasMany(Grade, { foreignKey: 'gradedById', as: 'gradedGrades' });
Grade.belongsTo(User, { foreignKey: 'gradedById', as: 'gradedBy' });

// User ↔ Announcement (autor)
User.hasMany(Announcement, { foreignKey: 'authorId', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Course ↔ Announcement (opcional)
Course.hasMany(Announcement, { foreignKey: 'courseId', as: 'announcements' });
Announcement.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Student ↔ Observation (1:N)
Student.hasMany(Observation, { foreignKey: 'studentId', as: 'observations' });
Observation.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Teacher ↔ Observation (1:N)
Teacher.hasMany(Observation, { foreignKey: 'teacherId', as: 'observations' });
Observation.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

// Course ↔ Activity (1:N)
Course.hasMany(Activity, { foreignKey: 'courseId', as: 'activities' });
Activity.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Activity ↔ Submission (1:N)
Activity.hasMany(Submission, { foreignKey: 'activityId', as: 'submissions' });
Submission.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });

// Student ↔ Submission (1:N)
Student.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions' });
Submission.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Representative ↔ Submission (1:N)
Representative.hasMany(Submission, { foreignKey: 'representativeId', as: 'submissions' });
Submission.belongsTo(Representative, { foreignKey: 'representativeId', as: 'representative' });

// Submission ↔ Evidence (1:N)
Submission.hasMany(Evidence, { foreignKey: 'submissionId', as: 'evidences' });
Evidence.belongsTo(Submission, { foreignKey: 'submissionId', as: 'submission' });

// Submission ↔ Comment (1:N)
Submission.hasMany(Comment, { foreignKey: 'submissionId', as: 'comments' });
Comment.belongsTo(Submission, { foreignKey: 'submissionId', as: 'submission' });

// User ↔ Comment (1:N)
User.hasMany(Comment, { foreignKey: 'authorId', as: 'userComments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Student ↔ Attendance (1:N)
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Course ↔ Attendance (1:N)
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendances' });
Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// User ↔ Attendance (quien registró la asistencia)
User.hasMany(Attendance, { foreignKey: 'registeredById', as: 'registeredAttendances' });
Attendance.belongsTo(User, { foreignKey: 'registeredById', as: 'registeredBy' });

// User ↔ Notification (1:N)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ AuditLog (1:N)
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Report (1:N)
User.hasMany(Report, { foreignKey: 'generatedById', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generatedById', as: 'generatedBy' });

export {
  User,
  Student,
  Teacher,
  Course,
  Enrollment,
  Grade,
  Announcement,
  Observation,
  Activity,
  Attendance,
  AuditLog,
  Report,
  Representative,
  Submission,
  Evidence,
  Comment,
  Notification,
};
