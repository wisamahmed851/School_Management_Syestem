import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../entity/attendance.entity';

// ── Per-student record inside the bulk mark payload ──────────────────────────

export class AttendanceRecordDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  student_id: number;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus, {
    message: `status must be one of: ${Object.values(AttendanceStatus).join(', ')}`,
  })
  status: AttendanceStatus;
}

// ── Bulk mark ─────────────────────────────────────────────────────────────────

export class MarkAttendanceDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  class_id: number;

  @IsNotEmpty()
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsArray()
  @ArrayMinSize(1, { message: 'records must contain at least one entry' })
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

// ── Single-record correction ───────────────────────────────────────────────────

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus, {
    message: `status must be one of: ${Object.values(AttendanceStatus).join(', ')}`,
  })
  status?: AttendanceStatus;
}
