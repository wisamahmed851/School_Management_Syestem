import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from 'src/student/entity/student.entity';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export enum MarkedByType {
  ADMIN = 'admin',
  TEACHER = 'teacher',
}

@Entity({ name: 'attendance' })
@Unique('UQ_attendance_student_date', ['student_id', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Student FK ────────────────────────────────────────────────────────────

  @Column({ nullable: false })
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // ── Class FK ──────────────────────────────────────────────────────────────

  @Column({ nullable: false })
  class_id: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'class_id' })
  school_class: SchoolClass;

  // ── Attendance date (date only, no time component) ─────────────────────────

  @Index()
  @Column({ type: 'date', nullable: false })
  date: string; // YYYY-MM-DD

  // ── Status ────────────────────────────────────────────────────────────────

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: false,
  })
  status: AttendanceStatus;

  // ── Marked-by audit columns ───────────────────────────────────────────────
  // Stores the id of whoever marked attendance (admin.id or teacher.id)
  // and whether it was an admin or a teacher.
  // marked_by_type defaults to 'admin' for all existing rows — backfilled
  // automatically in AttendanceMigrationService on application bootstrap.

  @Column({ nullable: true })
  marked_by_id: number;

  @Column({
    type: 'enum',
    enum: MarkedByType,
    nullable: true,
    default: MarkedByType.ADMIN,
    comment: "'admin' or 'teacher' — indicates which table marked_by_id references",
  })
  marked_by_type: MarkedByType;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @Column({ type: 'date' })
  created_at: string;

  @Column({ type: 'date' })
  updated_at: string;

  @BeforeInsert()
  setCreateDateParts() {
    const today = new Date().toISOString().split('T')[0];
    this.created_at = today;
    this.updated_at = today;
  }
}
