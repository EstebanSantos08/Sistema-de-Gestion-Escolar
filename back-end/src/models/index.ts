import User from './User';
import Student from './Student';
import Teacher from './Teacher';
import Course from './Course';
import Enrollment from './Enrollment';
import Grade from './Grade';

// User ↔ Student (1:1)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Teacher (1:1)
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

export { User, Student, Teacher, Course, Enrollment, Grade };
