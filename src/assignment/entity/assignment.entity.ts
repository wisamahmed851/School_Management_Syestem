import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';
import { Subject } from 'src/subject/entity/subject.entity';

@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Class FK (required) ───────────────────────────────────────────────────

  @Column({ nullable: false })
  class_id: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'class_id' })
  school_class: SchoolClass;

  // ── Subject FK (optional — must be mapped to this class via ClassSubjectTeacher) ──

  @Column({ nullable: true })
  subject_id: number;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // ── Teacher FK (optional) ─────────────────────────────────────────────────

  @Column({ nullable: true })
  teacher_id: number;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  // ── Assignment details ────────────────────────────────────────────────────

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: false })
  due_date: string;

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
