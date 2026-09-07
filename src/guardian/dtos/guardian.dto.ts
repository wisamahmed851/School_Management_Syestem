import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateGuardianDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  relation_to_student?: string;

  /** Used only to create the linked User account. Not stored on Guardian. */
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class UpdateGuardianDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  relation_to_student?: string;
}
