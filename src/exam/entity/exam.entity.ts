import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';

export enum ExamType {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  UNIT_TEST = 'unit_test',
}

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({
    type: 'enum',
    enum: ExamType,
    nullable: false,
  })
  exam_type: ExamType;

  // ── Class FK (required) ───────────────────────────────────────────────────

  @Column({ nullable: false })
  class_id: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'class_id' })
  school_class: SchoolClass;

  // ── Subject FK (optional) ─────────────────────────────────────────────────

  @Column({ nullable: true })
  subject_id: number;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'date', nullable: false })
  exam_date: string;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  /** Total marks available for this exam (used to calculate percentage). */
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: false })
  total_marks: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'smallint',
    default: 1,
    nullable: false,
    comment: '1 = active, 0 = inactive',
  })
  status: number;

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
