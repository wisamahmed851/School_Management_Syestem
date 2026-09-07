/**
 * Standalone seed script — runs outside of NestJS bootstrap.
 * Execute with:  npm run seed
 *
 * Inserts all test data in dependency order.
 * All operations are idempotent — safe to run multiple times.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// ── entity imports ────────────────────────────────────────────────────────────
import { Role }                   from '../roles/entity/roles.entity';
import { Admin }                  from '../admin/entity/admin.entity';
import { AdminRole }              from '../assig-roles-admin/entity/admin-role.entity';
import { User }                   from '../users/entity/user.entity';
import { UserRole }               from '../assig-roles-user/entity/user-role.entity';
import { Teacher }                from '../teacher/entity/teacher.entity';
import { Guardian }               from '../guardian/entity/guardian.entity';
import { SchoolClass }            from '../school-class/entity/school-class.entity';
import { Subject }                from '../subject/entity/subject.entity';
import { ClassSubjectTeacher }    from '../class-subject/entity/class-subject-teacher.entity';
import { Student }                from '../student/entity/student.entity';
import { Attendance, AttendanceStatus, MarkedByType } from '../attendance/entity/attendance.entity';
import { Assignment }             from '../assignment/entity/assignment.entity';
import { AssignmentSubmission, SubmissionStatus } from '../assignment/entity/assignment-submission.entity';

// ── DB connection ─────────────────────────────────────────────────────────────

const ds = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '',
  database: 'school_management_syestem',
  synchronize: false,        // schema already created by the app
  entities: [
    Role, Admin, AdminRole,
    User, UserRole,
    Teacher, Guardian,
    SchoolClass, Subject, ClassSubjectTeacher,
    Student,
    Attendance, Assignment, AssignmentSubmission,
  ],
});

// ── helpers ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];
const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};
const hash = (pw: string) => bcrypt.hash(pw, 10);

async function upsertRole(repo: any, name: string, guard: string): Promise<Role> {
  let role = await repo.findOne({ where: { name } });
  if (!role) {
    role = repo.create({ name, guard });
    role = await repo.save(role);
    console.log(`  ✓ Role created: ${name}`);
  } else {
    console.log(`  · Role exists:  ${name}`);
  }
  return role;
}

async function upsertUser(
  repo: any,
  roleRepo: any,
  name: string, email: string, password: string, roleName: string,
): Promise<User> {
  let user = await repo.findOne({ where: { email } });
  if (!user) {
    user = repo.create({ name, email, password: await hash(password) });
    user = await repo.save(user);
  }
  // assign role if not already assigned
  const role = await roleRepo.findOne({ where: { name: roleName } });
  if (role) {
    const urRepo = ds.getRepository(UserRole);
    const exists = await urRepo.findOne({ where: { user_id: user.id, role_id: role.id } });
    if (!exists) {
      await urRepo.save(urRepo.create({ user_id: user.id, role_id: role.id, user, role }));
    }
  }
  return user;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Starting seed…\n');
  await ds.initialize();

  const roleRepo    = ds.getRepository(Role);
  const adminRepo   = ds.getRepository(Admin);
  const arRepo      = ds.getRepository(AdminRole);
  const userRepo    = ds.getRepository(User);
  const teacherRepo = ds.getRepository(Teacher);
  const guardRepo   = ds.getRepository(Guardian);
  const classRepo   = ds.getRepository(SchoolClass);
  const subjRepo    = ds.getRepository(Subject);
  const cstRepo     = ds.getRepository(ClassSubjectTeacher);
  const stuRepo     = ds.getRepository(Student);
  const attRepo     = ds.getRepository(Attendance);
  const asgRepo     = ds.getRepository(Assignment);
  const subRepo     = ds.getRepository(AssignmentSubmission);

  // ── 1. ROLES ──────────────────────────────────────────────────────────────
  console.log('── Roles');
  const roleAdmin   = await upsertRole(roleRepo, 'admin',   'admin');
  const roleManager = await upsertRole(roleRepo, 'manager', 'admin');
  const roleUser    = await upsertRole(roleRepo, 'user',    'user');
  const roleTeacher = await upsertRole(roleRepo, 'teacher', 'user');
  const roleParent  = await upsertRole(roleRepo, 'parent',  'user');
  const roleStudent = await upsertRole(roleRepo, 'student', 'user');

  // ── 2. ADMIN ──────────────────────────────────────────────────────────────
  console.log('\n── Admin account');
  let superAdmin = await adminRepo.findOne({ where: { email: 'admin@school.com' } });
  if (!superAdmin) {
    superAdmin = adminRepo.create({
      name: 'Super Admin',
      email: 'admin@school.com',
      password: await hash('Admin@1234'),
      status: 1,
    });
    superAdmin = await adminRepo.save(superAdmin);
    const ar = arRepo.create({ admin_id: superAdmin.id, role_id: roleAdmin.id, admin: superAdmin, role: roleAdmin });
    await arRepo.save(ar);
    console.log(`  ✓ Admin created: admin@school.com`);
  } else {
    console.log(`  · Admin exists:  admin@school.com`);
  }

  // ── 3. TEACHER USER ACCOUNTS + TEACHER RECORDS ───────────────────────────
  console.log('\n── Teachers');

  const teacherData = [
    { name: 'Ms. Ayesha Malik',  email: 'ayesha@school.com',  pw: 'Teacher@111', spec: 'Mathematics' },
    { name: 'Mr. Bilal Hassan',  email: 'bilal@school.com',   pw: 'Teacher@222', spec: 'Science'     },
    { name: 'Ms. Sana Qureshi',  email: 'sana@school.com',    pw: 'Teacher@333', spec: 'English'     },
  ];

  const teachers: Teacher[] = [];
  for (const td of teacherData) {
    const user = await upsertUser(userRepo, roleRepo, td.name, td.email, td.pw, 'teacher');
    let teacher = await teacherRepo.findOne({ where: { email: td.email } });
    if (!teacher) {
      teacher = teacherRepo.create({
        name: td.name,
        email: td.email,
        phone: '+92300000000' + (teachers.length + 1),
        subject_specialization: td.spec,
        joining_date: '2024-08-01',
        user_id: user.id,
      });
      teacher = await teacherRepo.save(teacher);
      console.log(`  ✓ Teacher created: ${td.email}`);
    } else {
      console.log(`  · Teacher exists:  ${td.email}`);
    }
    teachers.push(teacher);
  }
  const [t1, t2, t3] = teachers; // ayesha, bilal, sana

  // ── 4. GUARDIAN USER ACCOUNTS + GUARDIAN RECORDS ─────────────────────────
  console.log('\n── Guardians');

  const guardianData = [
    { name: 'Mr. Tariq Hussain', email: 'tariq@gmail.com',  pw: 'Parent@111', relation: 'Father' },
    { name: 'Mrs. Nadia Iqbal',  email: 'nadia@gmail.com',  pw: 'Parent@222', relation: 'Mother' },
    { name: 'Mr. Asim Raza',     email: 'asim@gmail.com',   pw: 'Parent@333', relation: 'Father' },
  ];

  const guardians: Guardian[] = [];
  for (const gd of guardianData) {
    const user = await upsertUser(userRepo, roleRepo, gd.name, gd.email, gd.pw, 'parent');
    let guardian = await guardRepo.findOne({ where: { email: gd.email } });
    if (!guardian) {
      guardian = guardRepo.create({
        name: gd.name,
        email: gd.email,
        phone: '+92311000000' + (guardians.length + 1),
        relation_to_student: gd.relation,
        user_id: user.id,
      });
      guardian = await guardRepo.save(guardian);
      console.log(`  ✓ Guardian created: ${gd.email}`);
    } else {
      console.log(`  · Guardian exists:  ${gd.email}`);
    }
    guardians.push(guardian);
  }
  const [g1, g2, g3] = guardians; // tariq, nadia, asim

  // ── 5. SCHOOL CLASSES ─────────────────────────────────────────────────────
  console.log('\n── Classes');

  // Class 1: Ayesha (t1) is homeroom teacher
  // Class 2: Bilal  (t2) is homeroom teacher
  const classData = [
    { name: 'Grade 5-A', section: 'A', teacher: t1 },
    { name: 'Grade 5-B', section: 'B', teacher: t2 },
  ];

  const classes: SchoolClass[] = [];
  for (const cd of classData) {
    let cls = await classRepo.findOne({ where: { name: cd.name } });
    if (!cls) {
      cls = classRepo.create({ name: cd.name, section: cd.section, class_teacher_id: cd.teacher.id });
      cls = await classRepo.save(cls);
      console.log(`  ✓ Class created: ${cd.name} (homeroom: ${cd.teacher.name})`);
    } else {
      console.log(`  · Class exists:  ${cd.name}`);
    }
    classes.push(cls);
  }
  const [c1, c2] = classes;

  // ── 6. SUBJECTS ───────────────────────────────────────────────────────────
  console.log('\n── Subjects');

  const subjectData = [
    { name: 'Mathematics', code: 'MATH-101' },
    { name: 'Science',     code: 'SCI-101'  },
    { name: 'English',     code: 'ENG-101'  },
    { name: 'Urdu',        code: 'URD-101'  },
  ];

  const subjects: Subject[] = [];
  for (const sd of subjectData) {
    let subj = await subjRepo.findOne({ where: { code: sd.code } });
    if (!subj) {
      subj = subjRepo.create({ name: sd.name, code: sd.code });
      subj = await subjRepo.save(subj);
      console.log(`  ✓ Subject created: ${sd.name}`);
    } else {
      console.log(`  · Subject exists:  ${sd.name}`);
    }
    subjects.push(subj);
  }
  const [sMath, sSci, sEng, sUrdu] = subjects;

  // ── 7. CLASS-SUBJECT-TEACHER MAPPINGS ────────────────────────────────────
  console.log('\n── ClassSubjectTeacher mappings');

  /**
   * Ownership test coverage:
   *   C1 = Grade 5-A  (homeroom: Ayesha / t1)
   *   C2 = Grade 5-B  (homeroom: Bilal  / t2)
   *
   *   Mapping                        teacher  note
   *   C1 + Math   → Ayesha  (t1)   ← homeroom teacher of C1 teaching Math
   *   C1 + Science→ Bilal   (t2)   ← NOT homeroom of C1 (tests cross-class teach)
   *   C1 + English→ Sana    (t3)   ← NOT homeroom of C1
   *   C2 + Math   → Bilal   (t2)   ← homeroom teacher of C2 teaching Math
   *   C2 + Science→ Ayesha  (t1)   ← NOT homeroom of C2 (cross-class)
   *   C2 + Urdu   → Sana    (t3)   ← NOT homeroom of C2
   */
  const cstData = [
    { cls: c1, subj: sMath, teacher: t1 },
    { cls: c1, subj: sSci,  teacher: t2 },
    { cls: c1, subj: sEng,  teacher: t3 },
    { cls: c2, subj: sMath, teacher: t2 },
    { cls: c2, subj: sSci,  teacher: t1 },
    { cls: c2, subj: sUrdu, teacher: t3 },
  ];

  const cstMappings: ClassSubjectTeacher[] = [];
  for (const m of cstData) {
    let mapping = await cstRepo.findOne({
      where: { class_id: m.cls.id, subject_id: m.subj.id },
    });
    if (!mapping) {
      mapping = cstRepo.create({
        class_id: m.cls.id,
        subject_id: m.subj.id,
        teacher_id: m.teacher.id,
      });
      mapping = await cstRepo.save(mapping);
      console.log(`  ✓ ${m.cls.name} + ${m.subj.name} → ${m.teacher.name}`);
    } else {
      console.log(`  · ${m.cls.name} + ${m.subj.name} (exists)`);
    }
    cstMappings.push(mapping);
  }

  // ── 8. STUDENTS ───────────────────────────────────────────────────────────
  console.log('\n── Students');

  /**
   * 6 students — 3 in C1, 3 in C2.
   * Tariq (g1) has 2 children (Sara & Umar both in C1) — for parent portal multi-child test.
   * Nadia (g2) has 1 child in C1.
   * Asim  (g3) has 2 children (1 in C1 no wait — 1 in C2, 1 in C2) for variety.
   *
   *   C1: Sara(g1), Umar(g1), Hina(g2)
   *   C2: Ali(g3), Zara(g3), Hamza(g2)  ← Nadia has Hina(C1) + Hamza(C2) = 2 children too
   */
  const studentData = [
    { name: 'Sara Ahmed',    roll: 'G5A-001', dob: '2014-03-10', gender: 'female', id_no: '42101-1111111-1', cls: c1, guardian: g1 },
    { name: 'Umar Hussain',  roll: 'G5A-002', dob: '2013-11-22', gender: 'male',   id_no: '42101-2222222-2', cls: c1, guardian: g1 },
    { name: 'Hina Iqbal',    roll: 'G5A-003', dob: '2014-07-05', gender: 'female', id_no: '42101-3333333-3', cls: c1, guardian: g2 },
    { name: 'Ali Raza',      roll: 'G5B-001', dob: '2013-09-18', gender: 'male',   id_no: '42101-4444444-4', cls: c2, guardian: g3 },
    { name: 'Zara Khan',     roll: 'G5B-002', dob: '2014-01-30', gender: 'female', id_no: '42101-5555555-5', cls: c2, guardian: g3 },
    { name: 'Hamza Noor',    roll: 'G5B-003', dob: '2013-06-14', gender: 'male',   id_no: '42101-6666666-6', cls: c2, guardian: g2 },
  ];

  const students: Student[] = [];
  for (const sd of studentData) {
    let stu = await stuRepo.findOne({ where: { roll_no: sd.roll } });
    if (!stu) {
      stu = stuRepo.create({
        name: sd.name,
        roll_no: sd.roll,
        dob: sd.dob,
        gender: sd.gender,
        identity_number: sd.id_no,
        class_id: sd.cls.id,
        guardian_id: sd.guardian.id,
        admission_date: '2024-04-01',
      });
      stu = await stuRepo.save(stu);
      console.log(`  ✓ Student: ${sd.name} (${sd.cls.name}, guardian: ${sd.guardian.name})`);
    } else {
      console.log(`  · Student exists: ${sd.name}`);
    }
    students.push(stu);
  }
  const [sara, umar, hina, ali, zara, hamza] = students;

  // ── 9. ATTENDANCE RECORDS (past date for C1) ──────────────────────────────
  console.log('\n── Attendance');

  const attDate = pastDate(3); // 3 days ago
  const c1Students = [sara, umar, hina];
  const attStatuses = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
  ];

  for (let i = 0; i < c1Students.length; i++) {
    const existing = await attRepo.findOne({
      where: { student_id: c1Students[i].id, date: attDate },
    });
    if (!existing) {
      const att = attRepo.create({
        student_id: c1Students[i].id,
        class_id: c1.id,
        date: attDate,
        status: attStatuses[i],
        marked_by_id: t1.id,
        marked_by_type: MarkedByType.TEACHER,
      });
      await attRepo.save(att);
      console.log(`  ✓ Attendance: ${c1Students[i].name} on ${attDate} → ${attStatuses[i]}`);
    } else {
      console.log(`  · Attendance exists: ${c1Students[i].name} on ${attDate}`);
    }
  }

  // ── 10. ASSIGNMENTS ───────────────────────────────────────────────────────
  console.log('\n── Assignments');

  // Assignment 1: C1 + Math, created by Ayesha (t1) — homeroom teacher
  // Assignment 2: C1 + Science, created by Bilal (t2) — non-homeroom teacher in C1
  const asgData = [
    {
      class_id: c1.id, subject_id: sMath.id, teacher_id: t1.id,
      title: 'Chapter 3 — Algebra Exercises',
      description: 'Complete exercises 1–20 from the textbook.',
      due_date: pastDate(-7), // 7 days from now
    },
    {
      class_id: c1.id, subject_id: sSci.id, teacher_id: t2.id,
      title: 'Lab Report — Photosynthesis',
      description: 'Write a lab report on the photosynthesis experiment.',
      due_date: pastDate(-10),
    },
  ];

  const assignments: Assignment[] = [];
  for (const ad of asgData) {
    let asg = await asgRepo.findOne({
      where: { title: ad.title, class_id: ad.class_id },
    });
    if (!asg) {
      asg = asgRepo.create(ad);
      asg = await asgRepo.save(asg);

      // auto-generate pending submissions for all students in class
      const stuInClass = await stuRepo.find({ where: { class_id: ad.class_id } });
      for (const s of stuInClass) {
        await subRepo.save(subRepo.create({
          assignment_id: asg.id,
          student_id: s.id,
          status: SubmissionStatus.PENDING,
        }));
      }
      console.log(`  ✓ Assignment: "${ad.title}" (${stuInClass.length} submissions auto-generated)`);
    } else {
      console.log(`  · Assignment exists: "${ad.title}"`);
    }
    assignments.push(asg);
  }

  // Update a couple of submissions to non-pending statuses for richer test data
  if (assignments[0]) {
    // Sara: submitted
    const saraSub = await subRepo.findOne({
      where: { assignment_id: assignments[0].id, student_id: sara.id },
    });
    if (saraSub && saraSub.status === SubmissionStatus.PENDING) {
      saraSub.status = SubmissionStatus.GRADED;
      saraSub.marks_obtained = 87.5;
      saraSub.feedback = 'Excellent work on Q1–Q15. Minor errors in Q16–Q20.';
      saraSub.submitted_at = pastDate(1);
      await subRepo.save(saraSub);
      console.log(`  ✓ Sara's submission: graded (87.5)`);
    }

    // Umar: submitted
    const umarSub = await subRepo.findOne({
      where: { assignment_id: assignments[0].id, student_id: umar.id },
    });
    if (umarSub && umarSub.status === SubmissionStatus.PENDING) {
      umarSub.status = SubmissionStatus.SUBMITTED;
      umarSub.submitted_at = pastDate(1);
      await subRepo.save(umarSub);
      console.log(`  ✓ Umar's submission: submitted (awaiting grade)`);
    }
  }

  await ds.destroy();

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     SEED COMPLETE ✓                          ║
╠════════════════╦═══════════════════════════╦═════════════════╣
║  Role          ║  Email                    ║  Password       ║
╠════════════════╬═══════════════════════════╬═════════════════╣
║  admin         ║  admin@school.com         ║  Admin@1234     ║
╠════════════════╬═══════════════════════════╬═════════════════╣
║  teacher       ║  ayesha@school.com        ║  Teacher@111    ║
║  teacher       ║  bilal@school.com         ║  Teacher@222    ║
║  teacher       ║  sana@school.com          ║  Teacher@333    ║
╠════════════════╬═══════════════════════════╬═════════════════╣
║  parent        ║  tariq@gmail.com          ║  Parent@111     ║
║  parent        ║  nadia@gmail.com          ║  Parent@222     ║
║  parent        ║  asim@gmail.com           ║  Parent@333     ║
╚════════════════╩═══════════════════════════╩═════════════════╝

  Ownership test notes:
  • Ayesha (t1) is homeroom of Grade 5-A → can mark attendance for C1
  • Bilal  (t2) is homeroom of Grade 5-B → can mark attendance for C2
  • Sana   (t3) is NOT homeroom of any class → attendance mark should return 403
  • Bilal teaches Science in Grade 5-A (not homeroom) → can create Science assignments for C1
  • Tariq  (g1) has 2 children: Sara + Umar (both in Grade 5-A)
  • Nadia  (g2) has 2 children: Hina (Grade 5-A) + Hamza (Grade 5-B)
  • Asim   (g3) has 2 children: Ali  + Zara  (both in Grade 5-B)
`);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
