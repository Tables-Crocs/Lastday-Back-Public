import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { Test } from './test.model';

@Module({
  // User라고 쓰면 몽고에 users collection이 생성된다.
  imports: [MongooseModule.forFeature([{ name: 'Test', schema: Test }])],
  controllers: [TestController],
  providers: [TestService],
  // exports: [TestService],
})
export class TestModule {}
