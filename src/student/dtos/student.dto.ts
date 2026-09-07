import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  roll_no: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsNotEmpty()
  @IsString()
  identity_number: string;

  /** Required — student must be assigned to a class on enrollment. */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  class_id: number;

  /** Required — student must have a linked guardian on enrollment. */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  guardian_id: number;

  @IsOptional()
  @IsDateString()
  admission_date?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  roll_no?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  identity_number?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  class_id?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  guardian_id?: number;

  @IsOptional()
  @IsDateString()
  admission_date?: string;
}
