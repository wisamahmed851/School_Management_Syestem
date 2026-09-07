import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus } from '../entity/assignment-submission.entity';

// ── Assignment DTOs ───────────────────────────────────────────────────────────

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  class_id: number;

  /**
   * Optional until the Subject module is built.
   * Wire this to a Subject FK once that module exists.
   */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subject_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacher_id?: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  due_date: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  class_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subject_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacher_id?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

// ── Submission update DTO (admin/teacher grades a student) ────────────────────

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionStatus, {
    message: `status must be one of: ${Object.values(SubmissionStatus).join(', ')}`,
  })
  status?: SubmissionStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  marks_obtained?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
