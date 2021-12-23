import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RecommendResponsePayload {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  @IsNotEmpty()
  location: { x: number; y: number };

  @ApiProperty()
  @IsNotEmpty()
  location_string: string;

  @ApiProperty()
  @IsNotEmpty()
  travel_time: number;

  @ApiProperty()
  @IsNotEmpty()
  free_time: number;

  @ApiProperty()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty()
  @IsNotEmpty()
  content_type: string;
}

export class RecommendHistoriesRequestPayload {
  @ApiProperty()
  @IsNotEmpty()
  sourceTitle: string;

  @ApiProperty()
  destTitle: string;

  @ApiProperty()
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
}

export class CoordinateResponsePayload {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  location: { x: number; y: number };
}
