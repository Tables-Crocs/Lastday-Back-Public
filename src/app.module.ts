import * as winston from 'winston';
import * as rotateFile from 'winston-daily-rotate-file';
import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AuthModule } from './auth/auth.module';
import { WinstonModule } from './winston/winston.module';
import { AccessControlModule } from 'nest-access-control';
import { roles } from './app.roles';
import { UserModule } from './user/user.module';
import { CommunityModule } from './community/community.module';
import { StationModule } from './station/station.module';
import { RecommendController } from './recommend/recommend.controller';
import { RecommendModule } from './recommend/recommend.module';
import * as mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get('DB'),
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useFindAndModify: false,
        } as MongooseModuleAsyncOptions),
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isEnv('dev')
          ? {
              level: 'info',
              format: winston.format.json(),
              defaultMeta: { service: 'user-service' },
              transports: [
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
              ],
            }
          : {
              level: 'info',
              format: winston.format.json(),
              defaultMeta: { service: 'user-service' },
              transports: [
                new winston.transports.File({
                  filename: 'logs/error.log',
                  level: 'error',
                }),
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
                new rotateFile({
                  filename: 'logs/application-%DATE%.log',
                  datePattern: 'YYYY-MM-DD',
                  zippedArchive: true,
                  maxSize: '20m',
                  maxFiles: '14d',
                }),
              ],
            };
      },
    }),
    AccessControlModule.forRoles(roles),
    ConfigModule,
    AuthModule,
    UserModule,
    CommunityModule,
    StationModule,
    RecommendModule,
    // RecommendModule,
    /* add new modules here */
  ],
  controllers: [AppController, RecommendController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // mongo에 날리는 쿼리를 로그로 남길 수 있음!
  configure() {
    mongoose.set('debug', true);
  }
}
