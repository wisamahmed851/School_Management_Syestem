import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Student } from 'src/student/entity/student.entity';

export enum ResultStatus {
  PENDING = 'pending',
  PASS = 'pass',
  FAIL = 'fail',
  ABSENT = 'absent',
}

@Entity({ name: 'exam_results' })
@Unique('UQ_result_exam_student', ['exam_id', 'student_id'])
export class ExamResult {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Exam FK ───────────────────────────────────────────────────────────────

  @Column({ nullable: false })
  exam_id: number;

  @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  // ── Student FK ────────────────────────────────────────────────────────────

  @Column({ nullable: false })
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // ── Result fields ─────────────────────────────────────────────────────────

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  marks_obtained: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Calculated percentage' })
  percentage: number;

  @Column({
    type: 'enum',
    enum: ResultStatus,
    default: ResultStatus.PENDING,
    nullable: false,
  })
  status: ResultStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

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
