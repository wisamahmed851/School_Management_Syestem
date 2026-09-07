import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '../entity/exam.entity';
import { ResultStatus } from '../entity/exam-result.entity';

// ── Exam DTOs ─────────────────────────────────────────────────────────────────

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(ExamType, {
    message: `exam_type must be one of: ${Object.values(ExamType).join(', ')}`,
  })
  exam_type: ExamType;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  class_id: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subject_id?: number;

  @IsNotEmpty()
  @IsDateString()
  exam_date: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'start_time must be HH:MM or HH:MM:SS' })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'end_time must be HH:MM or HH:MM:SS' })
  end_time?: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  total_marks: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ExamType, {
    message: `exam_type must be one of: ${Object.values(ExamType).join(', ')}`,
  })
  exam_type?: ExamType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  class_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subject_id?: number;

  @IsOptional()
  @IsDateString()
  exam_date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'start_time must be HH:MM or HH:MM:SS' })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'end_time must be HH:MM or HH:MM:SS' })
  end_time?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  total_marks?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// ── Result DTO (enter/update a student's result) ──────────────────────────────

export class UpdateResultDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  marks_obtained?: number;

  @IsOptional()
  @IsEnum(ResultStatus, {
    message: `status must be one of: ${Object.values(ResultStatus).join(', ')}`,
  })
  status?: ResultStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
