import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { Student } from 'src/student/entity/student.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  LATE = 'late',
  GRADED = 'graded',
}

@Entity({ name: 'assignment_submissions' })
@Unique('UQ_submission_assignment_student', ['assignment_id', 'student_id'])
export class AssignmentSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Assignment FK ─────────────────────────────────────────────────────────

  @Column({ nullable: false })
  assignment_id: number;

  @ManyToOne(() => Assignment, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  // ── Student FK ────────────────────────────────────────────────────────────

  @Column({ nullable: false })
  student_id: number;

  @ManyToOne(() => Student, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // ── Submission fields ─────────────────────────────────────────────────────

  @Column({ type: 'date', nullable: true })
  submitted_at: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
    nullable: false,
  })
  status: SubmissionStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  marks_obtained: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

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
