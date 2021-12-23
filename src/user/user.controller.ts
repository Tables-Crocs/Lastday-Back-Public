import { IdPayload } from './../community/payload/post.payload';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  forwardRef,
  Inject,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ACGuard, UseRoles, UserRoles } from 'nest-access-control';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { IUser } from './model/user.model';
import { UserPayloadPatch } from './payload/user.patch.payload';

import { IGenericMsgBody } from '../config/payload/response.generic';
import { CommunityService } from '../community/community.service';
import { AuthService } from 'src/auth/auth.service';

@ApiBearerAuth()
@ApiTags('user')
@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commService: CommunityService,
  ) {}

  @Get('/histories')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Get histories succeeded' })
  @ApiResponse({ status: 400, description: 'Get histories failed' })
  async getHistory(@Req() { user }: any): Promise<IGenericMsgBody> {
    const result = await this.userService.getHistory(user._id);
    return { statusCode: 200, message: '유저 장소 히스토리', data: result };
  }

  @Delete('/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Get histories succeeded' })
  @ApiResponse({ status: 400, description: 'Get histories failed' })
  async deleteHistory(
    @Req() { user }: any,
    @Body() historyId: IdPayload,
  ): Promise<IGenericMsgBody> {
    try {
      await this.userService.deleteHistory(user._id, historyId.id);
    } catch (error) {
      throw new BadRequestException('히스토리 삭제 실패!');
    }
    return { statusCode: 201, message: '히스토리 삭제 완료' };
  }

  /**
   *
   */
  @Get('likes')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: `Get User's like posts success` })
  @ApiResponse({ status: 400, description: `Get User's like posts failed` })
  async getUserLike(@Req() { user }: any): Promise<IGenericMsgBody> {
    const results = await this.commService.getLikes(user._id);
    return { statusCode: 200, message: '유저가 좋아한 글', data: results };
  }

  /**
   *
   */
  @Get('comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: `Get User's comments success` })
  @ApiResponse({ status: 400, description: `Get User's comments failed` })
  async getUserComments(@Req() { user }: any): Promise<IGenericMsgBody> {
    const results = await this.commService.getComments(user._id);
    return { statusCode: 200, message: '유저가 댓글 단 글', data: results };
  }

  /**
   *
   */
  @Get('posts')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: `Get User's posts success` })
  @ApiResponse({ status: 400, description: `Get User's posts failed` })
  async getUserPosts(@Req() { user }: any): Promise<IGenericMsgBody> {
    const results = await this.commService.getPosts(user._id);
    return { statusCode: 200, message: '유저가 쓴 글', data: results };
  }

  @Get('scraps')
  @UseGuards(AuthGuard('jwt'))
  async getUserScraps(@Req() { user }: any): Promise<IGenericMsgBody> {
    const results = await this.commService.getScraps(user._id);
    return { statusCode: 200, message: '유저가 스크랩 한 글', data: results };
  }
  /**
   * Removes a profile from the database
   * @param {string} id the username to remove
   * @returns {Promise<IGenericMsgBody>} whether or not the profile has been deleted
   */
  @Get('report')
  @UseGuards(AuthGuard('jwt'), ACGuard)
  @ApiResponse({ status: 201, description: 'Report Received' })
  @ApiResponse({ status: 400, description: 'Report Failed' })
  async report(
    @Req() { user }: any,
    @Query('reportId') reportId: string,
  ): Promise<IGenericMsgBody> {
    console.log('신고자: ', user._id, '신고된 아이디: ', reportId);
    await this.userService.report(user._id, reportId);
    return {
      statusCode: 201,
      message: '신고 완료',
    };
  }

  /**
   * Retrieves a particular profile
   * @param username the profile given username to fetch
   * @returns {Promise<IGenericMsgBody>} queried profile data
   */
  @Get(':username')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: 'Fetch Profile Request Received' })
  @ApiResponse({ status: 400, description: 'Fetch Profile Request Failed' })
  async getProfile(
    @Param('username') username: string,
  ): Promise<IGenericMsgBody> {
    const profile = await this.userService.getByUsername(username);
    if (!profile) {
      throw new BadRequestException(
        'The profile with that username could not be found.',
      );
    }
    return {
      statusCode: 200,
      message: `유저 정보 확인`,
      data: profile,
    };
    // return profile;
  }

  /**
   * Edit a profile
   * @param {RegisterPayload} payload
   * @returns {Promise<IUser>} mutated profile data
   */
  @Patch()
  @UseGuards(AuthGuard('jwt'))
  @UseRoles({
    resource: 'profiles',
    action: 'update',
    possession: 'any',
  })
  @ApiResponse({ status: 201, description: 'Patch Profile Request Received' })
  @ApiResponse({ status: 400, description: 'Patch Profile Request Failed' })
  async patchProfile(
    @Body() payload: UserPayloadPatch,
    @Req() { user }: any,
  ): Promise<IGenericMsgBody> {
    return await this.userService.edit({
      ...payload,
      username: user.username,
    });
  }

  /**
   * Removes a profile from the database
   * @param {string} username the username to remove
   * @returns {Promise<IGenericMsgBody>} whether or not the profile has been deleted
   */
  @Delete(':username')
  @UseGuards(AuthGuard('jwt'), ACGuard)
  @UseRoles({
    resource: 'profile',
    action: 'delete',
    possession: 'own',
  })
  @ApiResponse({ status: 201, description: 'Delete Profile Request Received' })
  @ApiResponse({ status: 400, description: 'Delete Profile Request Failed' })
  async delete(@Param('username') username: string): Promise<IGenericMsgBody> {
    return await this.userService.delete(username);
  }
}
