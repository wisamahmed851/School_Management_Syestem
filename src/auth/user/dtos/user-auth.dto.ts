import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class UserRegisterDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  phone?: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirm_password: string;

  @IsOptional()
  image?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  image?: string;
}
