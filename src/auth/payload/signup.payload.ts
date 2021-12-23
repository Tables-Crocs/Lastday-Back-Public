import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../user/model/user.model';

import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsAlphanumeric,
  Matches,
} from 'class-validator';

/**
 * Register Payload Class
 */
export class SignUpPayload {
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
  // @IsNotEmpty()
  // @Matches(/^[가-힇a-zA-Z]+$/)
  name: string;
}


export class VerifyEmailPayload{
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordPayload{
  @ApiProperty()
  @IsNotEmpty()
  username: string;
}