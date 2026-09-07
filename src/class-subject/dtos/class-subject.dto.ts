import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassSubjectDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  class_id: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  subject_id: number;

  /** Optional — a subject can be mapped to a class before a teacher is assigned. */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacher_id?: number;
}

export class UpdateClassSubjectDto {
  /** Reassign (or unset) the teacher for an existing class-subject pairing. */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacher_id?: number;
}
