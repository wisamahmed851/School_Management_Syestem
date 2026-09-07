import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Entity({ name: 'school_classes' })
export class SchoolClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  class_teacher_id: number;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'class_teacher_id' })
  class_teacher: Teacher;

  /**
   * Reserved for future use (e.g. "A", "B", "Morning").
   * Stored but not validated or enforced at this stage.
   */
  @Column({ type: 'varchar', nullable: true })
  section: string;

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
