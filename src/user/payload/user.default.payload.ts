import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../model/user.model';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsAlphanumeric,
  Matches,
} from 'class-validator';

/**
 * Patch Profile Payload Class
 */
export class UserPayload {
  /**
   * User type field
   */
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  usertype: UserType;

  /**
   * Username field
   */
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  username: string;

  /**
   * Password field
   */
  @ApiProperty()
  @IsNotEmpty()
  // @MinLength(8)
  password: string;

  /**
   * Name field
   */
  @ApiProperty()
  @IsNotEmpty()
  // @Matches(/^[가-힇a-zA-Z]+$/)
  name: string;
}