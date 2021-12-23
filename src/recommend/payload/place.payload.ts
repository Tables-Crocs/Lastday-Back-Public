import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Types } from 'joi';

export class PlaceCoord {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  x: number;

  @ApiProperty()
  @IsNotEmpty()
  y: number;
}

export class PlaceImagePayload {
  @ApiProperty()
  @IsNotEmpty()
  image: string;

  @ApiProperty()
  @IsNotEmpty()
  thumbnail: string;
}

export class PlaceInfoResponsePayload {
  @ApiProperty()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty()
  @IsNotEmpty()
  content_type: string;

  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  website: string;

  @ApiProperty()
  @IsNotEmpty()
  overview: string;

  @ApiProperty()
  @IsNotEmpty()
  image: string;

  @ApiProperty()
  @IsNotEmpty()
  thumbnail: string;

  @ApiProperty()
  @IsNotEmpty()
  images: PlaceImagePayload[];

  @ApiProperty()
  @IsNotEmpty()
  location: { x: number; y: number };
}

export class PlaceHistoryPayload {
  @ApiProperty()
  @IsNotEmpty()
  _id: string;

  @ApiProperty()
  @IsNotEmpty()
  sourceTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  destTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  time_taken: number;

  @ApiProperty()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty()
  @IsNotEmpty()
  contentTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  content_type: string;

  @ApiProperty()
  @IsNotEmpty()
  createdTime: Date;

  @ApiProperty()
  fmtDate: string;

  @ApiProperty()
  fmtTime: string;
}
