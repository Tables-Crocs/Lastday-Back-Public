import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentPayload {
  // 유효성 검사
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postId: string;

  userId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty()
  createdTime: Date;
}

export class DeleteCommentPayload {
  userId: string;

  // 유효성 검사
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commentId: string;
}
