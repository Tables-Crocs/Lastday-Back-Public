import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { City } from './model/board.model';
import { Post } from './model/post.model';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: 'City', schema: City }]),
    MongooseModule.forFeature([{ name: 'Post', schema: Post }]),
  ],
  providers: [CommunityService],
  controllers: [CommunityController],
  exports: [CommunityService],
})
export class CommunityModule {}
