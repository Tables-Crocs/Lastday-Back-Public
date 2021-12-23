import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StationService } from './station.service';
import { StationController } from './station.controller';
import { Station } from './model/station.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Station', schema: Station }]),
  ],
  providers: [StationService],
  controllers: [StationController],
  exports: [StationService]
})
export class StationModule {}
