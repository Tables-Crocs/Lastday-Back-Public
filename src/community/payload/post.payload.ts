import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreatePostPayload {
  // 유효성 검사
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  boardId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty()
  createdTime: Date;

  userId?: string;
}

export class PostDetailPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  mine: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  admin: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  likesCount: number;

  @ApiProperty()
  @IsNotEmpty()
  scrapsCount: number;

  @ApiProperty()
  @IsNotEmpty()
  commentsCount: number;

  @ApiProperty()
  @IsNotEmpty()
  like: boolean;

  @ApiProperty()
  @IsNotEmpty()
  scrap: boolean;

  @ApiProperty()
  @IsNotEmpty()
  comments: Array<any>;

  @ApiProperty()
  @IsNotEmpty()
  createdTime: string;
}

export class EditPostPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  userId?: string;
}

export class IdPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;
}
