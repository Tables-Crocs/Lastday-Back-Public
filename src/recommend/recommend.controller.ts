import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { IGenericMsgBody } from '../config/payload/response.generic';
import { RecommendHistoriesRequestPayload } from './payload/recommend.payload';
import { RecommendService } from './recommend.service';

// import {
//   RecommendRoomRequestPayload,
//   RecommendStationRequestPayload,
// } from './payload/recommend.payload';

@ApiBearerAuth()
@Controller('api/recommend')
@ApiTags('recommend')
export class RecommendController {
  constructor(
    private readonly recommendService: RecommendService,
    private readonly userService: UserService,
  ) {}

  @Get('room/:content_type/:candidates')
  @ApiResponse({
    status: 200,
    description: 'On-the-way recommendations done',
  })
  @ApiResponse({
    status: 400,
    description: 'On-the-way recommendation failed',
  })
  async recommendRoom(
    @Query('source_x') source_x: number,
    @Query('source_y') source_y: number,
    @Query('dest_x') dest_x: number,
    @Query('dest_y') dest_y: number,
    @Param('content_type') content_type: string,
    @Param('candidates') candidates: number,
    @Query('hour') limit_time_hour: number,
    @Query('minute') limit_time_min: number,
  ): Promise<IGenericMsgBody> {
    const results = await this.recommendService.getRoomRecommendation(
      source_x,
      source_y,
      dest_x,
      dest_y,
      content_type,
      candidates,
      limit_time_hour,
      limit_time_min,
    );
    return {
      statusCode: 200,
      message: '숙소 경로 기반 추천 리스트',
      data: results,
    };
  }

  @Get('station/:content_type/:candidates')
  @ApiResponse({
    status: 200,
    description: 'Near-by recommendation done',
  })
  @ApiResponse({
    status: 400,
    description: 'Near-by recommendation failed',
  })
  async recommendStation(
    @Query('source_x') source_x: number,
    @Query('source_y') source_y: number,
    @Query('radius') radius: number,
    @Param('content_type') content_type: string,
    @Param('candidates') candidates: number,
    @Query('hour') limit_time_hour: number,
    @Query('minute') limit_time_min: number,
  ): Promise<IGenericMsgBody> {
    const results = await this.recommendService.getStationRecommendation(
      source_x,
      source_y,
      radius,
      content_type,
      candidates,
      limit_time_hour,
      limit_time_min,
    );
    return { statusCode: 200, message: '역 기반 추천 리스트', data: results };
  }

  @Get('coordinate/:keyword')
  @ApiResponse({
    status: 200,
    description: 'Coordinate search done',
  })
  @ApiResponse({
    status: 400,
    description: 'Coordinate search failed',
  })
  async searchCoordinate(
    @Param('keyword') keyword: string,
  ): Promise<IGenericMsgBody> {
    const results = await this.recommendService.getCoordinate(keyword);
    return {
      statusCode: 200,
      message: '츨발지 검색 결과 리스트',
      data: results,
    };
  }

  @Get('/:contentId/:content_type')
  @ApiResponse({
    status: 200,
    description: 'Place more details succeeded',
  })
  @ApiResponse({
    status: 400,
    description: 'Place more details failed',
  })
  async placeInfo(
    @Param('contentId') contentId: string,
    @Param('content_type') content_type: string,
  ): Promise<IGenericMsgBody> {
    const results = await this.recommendService.getPlaceOverall(
      contentId,
      content_type,
    );
    return { statusCode: 200, message: '장소 상세 정보', data: results };
  }

  @Post('/histories')
  @UseGuards(AuthGuard('jwt'))
  async histories(
    @Body() reqBody: RecommendHistoriesRequestPayload,
    @Req() { user }: any,
  ): Promise<IGenericMsgBody> {
    const { sourceTitle, destTitle, contentId, contentTitle, content_type, time_taken } =
      reqBody;
    console.log('post histories');
    try {
      await this.userService.addHistory(
        user._id,
        sourceTitle,
        destTitle,
        contentId,
        contentTitle,
        content_type,
        time_taken,
      );
    } catch (error) {
      throw new BadRequestException('검색기록 추가 실패');
    }

    return {
      statusCode: 201,
      message: '검색기록 추가 완료',
    };
  }
}
