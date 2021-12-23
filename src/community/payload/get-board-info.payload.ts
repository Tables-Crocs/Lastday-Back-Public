import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GetBoardInfoPayload {
  @ApiProperty()
  @IsNotEmpty()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  prov_abb: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  first_article: string;
}

export class PostInfoPayload {
  @ApiProperty()
  @IsNotEmpty()
  _id: string;

  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  comments: string[];

  @ApiProperty()
  @IsNotEmpty()
  likes: string[];

  @ApiProperty()
  @IsNotEmpty()
  scraps: string[];

  @ApiProperty()
  @IsNotEmpty()
  createdTime: Date;
}

export class PostListPayload {
  @ApiProperty()
  @IsNotEmpty()
  _id: string;

  @ApiProperty()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  mine: boolean;

  @ApiProperty()
  @IsNotEmpty()
  admin: boolean;

  @ApiProperty()
  @IsNotEmpty()
  commentsCount: number;

  @ApiProperty()
  @IsNotEmpty()
  likesCount: number;

  @ApiProperty()
  @IsNotEmpty()
  scrapsCount: number;

  @ApiProperty()
  @IsNotEmpty()
  createdTimeFormatted: string;
}

export class GetBoardPayload {
  @ApiProperty()
  @IsNotEmpty()
  isFavorite: boolean;

  @ApiProperty()
  @IsNotEmpty()
  posts: PostListPayload[];
}
