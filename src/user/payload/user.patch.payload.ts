import { PartialType } from '@nestjs/mapped-types';
import { UserPayload } from './user.default.payload';
import { IsOptional } from 'class-validator';
export class UserPayloadPatch extends PartialType(UserPayload) {
  @IsOptional()
  newPassword?: string;

  @IsOptional()
  oldPassword?: string;
}
