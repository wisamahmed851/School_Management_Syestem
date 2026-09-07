import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSchoolClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  /** Optional — a class can exist without an assigned teacher. */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  class_teacher_id?: number;

  /** Reserved for future use. Not validated at this stage. */
  @IsOptional()
  @IsString()
  section?: string;
}

export class UpdateSchoolClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  class_teacher_id?: number;

  @IsOptional()
  @IsString()
  section?: string;
}
