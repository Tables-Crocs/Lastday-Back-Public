import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IGenericMsgBody } from '../config/payload/response.generic';
import { StationService } from './station.service';

@ApiBearerAuth()
@ApiTags('station')
@Controller('api/station')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Get('')
  @ApiResponse({ status: 200, description: 'Getting all stations successful' })
  @ApiResponse({ status: 400, description: 'Getting all stations failed' })
  async getStationsList(): Promise<IGenericMsgBody> {
    const stationsList = await this.stationService.getAllStations();
    if (!stationsList) {
      throw new BadRequestException('No Stations in DB');
    }
    return {
      statusCode: 200,
      message: '모든 터미널 정보 로딩 완료',
      data: stationsList,
    };
  }

  @Get('/search/:keyword')
  async searchKeyword(
    @Param('keyword') keyword: string,
  ): Promise<IGenericMsgBody> {
    const results = await this.stationService.search(keyword);
    return { statusCode: 200, message: '검색 결과', data: results };
  }
}
