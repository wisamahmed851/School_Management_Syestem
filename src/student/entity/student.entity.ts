import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Guardian } from 'src/guardian/entity/guardian.entity';
import { User } from 'src/users/entity/user.entity';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  roll_no: string;

  @Column({ type: 'date', nullable: true })
  dob: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ unique: true, nullable: false })
  identity_number: string;

  // ── Class FK (required) ───────────────────────────────────────────────────

  @Column({ nullable: false })
  class_id: number;

  @ManyToOne(() => SchoolClass, { nullable: false, onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'class_id' })
  school_class: SchoolClass;

  // ── Guardian FK (required) ────────────────────────────────────────────────

  @Column({ nullable: false })
  guardian_id: number;

  @ManyToOne(() => Guardian, { nullable: false, onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'guardian_id' })
  guardian: Guardian;

  @Column({ type: 'date', nullable: true })
  admission_date: string;

  // ── Future: linked User account for student portal login ──────────────────
  // Not used yet — reserved for when a student-facing portal is added.

  @Column({ nullable: true })
  user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ── Status & timestamps ───────────────────────────────────────────────────

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
