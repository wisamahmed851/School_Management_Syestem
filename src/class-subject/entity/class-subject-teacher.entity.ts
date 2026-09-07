import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Entity({ name: 'class_subject_teachers' })
@Unique('UQ_class_subject', ['class_id', 'subject_id'])
export class ClassSubjectTeacher {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Class FK (required) ───────────────────────────────────────────────────

  @Column({ nullable: false })
  class_id: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'class_id' })
  school_class: SchoolClass;

  // ── Subject FK (required) ─────────────────────────────────────────────────

  @Column({ nullable: false })
  subject_id: number;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // ── Teacher FK (optional — can be assigned later) ─────────────────────────

  @Column({ nullable: true })
  teacher_id: number;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

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
