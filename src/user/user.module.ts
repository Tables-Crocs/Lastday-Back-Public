import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from './model/user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommunityModule } from '../community/community.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    forwardRef(() => CommunityModule),
    ConfigModule,
    MongooseModule.forFeature([{ name: 'User', schema: User }]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
