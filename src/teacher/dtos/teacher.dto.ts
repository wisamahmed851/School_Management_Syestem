import { IsDateString, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  subject_specialization?: string;

  @IsOptional()
  @IsDateString()
  joining_date?: string;

  /** Used only to create the linked User account. Not stored on the Teacher record. */
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class UpdateTeacherDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  subject_specialization?: string;

  @IsOptional()
  @IsDateString()
  joining_date?: string;
}
