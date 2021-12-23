import { Module } from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { RecommendController } from './recommend.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [HttpModule, ConfigModule, UserModule],
  providers: [RecommendService],
  controllers: [RecommendController],
  exports: [RecommendService],
})
export class RecommendModule {}
