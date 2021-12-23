import {
  Controller,
  Body,
  Req,
  Query,
  Post,
  Get,
  Param,
  Delete,
  Patch,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ACGuard, UseRoles } from 'nest-access-control';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CommunityService } from './community.service';
import {
  CreatePostPayload,
  EditPostPayload,
  IdPayload,
} from './payload/post.payload';
import {
  CreateCommentPayload,
  DeleteCommentPayload,
} from './payload/comment.payload';
import { IGenericMsgBody } from '../config/payload/response.generic';

@ApiBearerAuth()
@Controller('api/community')
@ApiTags('community')
export class CommunityController {
  constructor(private readonly commService: CommunityService) {}

  @Get('/board')
  @ApiResponse({
    status: 200,
    description: 'Getting All Board Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Getting All Board Failed',
  })
  async getBoard(): Promise<IGenericMsgBody> {
    const boardList = await this.commService.getAllBoard();
    if (!boardList) {
      throw new BadRequestException('No boards in Database.');
    }
    return { statusCode: 200, message: '커뮤니티 정보 확인', data: boardList };
  }

  @Get('/board/nearby')
  @ApiResponse({
    status: 200,
    description: 'Getting All Board By Location Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Getting All Board By Location Failed',
  })
  async getBoardListNearby(
    @Query('x') x: number,
    @Query('y') y: number,
  ): Promise<IGenericMsgBody> {
    const boardList = await this.commService.getAllBoardNearby(x, y);
    if (!boardList) {
      throw new BadRequestException('No boards in Database.');
    }
    return { statusCode: 200, message: '커뮤니티 정보 확인', data: boardList };
  }

  @Get('/board/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'Getting All Board By Favorites Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Getting All Board By Favorites Failed',
  })
  async getBoardListFavorite(@Req() request: any): Promise<IGenericMsgBody> {
    const userId = request.user._id;
    const boardList = await this.commService.getAllBoardFavorite(userId);
    if (!boardList) {
      throw new BadRequestException('No boards in Database.');
    }
    return { statusCode: 200, message: '커뮤니티 정보 확인', data: boardList };
  }

  /**
   * @param boardId the profile given username to fetch
   * @returns {Promise<IBoard>} queried profile data
   */
  @Get('/postList')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: 'Getting Board Information Done' })
  @ApiResponse({ status: 400, description: 'Getting Board Information Failed' })
  async getPostList(
    @Req() { user }: any,
    @Query('boardId') boardId: string,
    @Query('pageNum') pageNum: number,
  ): Promise<IGenericMsgBody> {
    const boardInfo = await this.commService.getBoard(
      user._id,
      boardId,
      pageNum,
    );
    if (!boardInfo) {
      throw new BadRequestException('No board in Database.');
    }
    return { statusCode: 200, message: '커뮤니티 정보 확인', data: boardInfo };
  }

  /**
   * @param CreatePostPayload the profile given username to fetch
   * @returns {//TODO} queried profile data
   */
  @Post('/post')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Create New Post Request Done!' })
  @ApiResponse({ status: 400, description: 'Create New Post Failed!' })
  async createPost(
    @Body() postContent: CreatePostPayload,
    @Req() request: any,
  ): Promise<IGenericMsgBody> {
    postContent.userId = request.user._id;
    const newPostId = await this.commService.createPost(postContent);
    // TODO: output type 정해서 바꾸기
    if (!newPostId) {
      throw new BadRequestException('Failed to post in Board');
    }
    return {
      statusCode: 201,
      message: '커뮤니티 게시글 생성 완료',
      data: newPostId,
    };
  }

  /**
   * @param CreatePostPayload the profile given username to fetch
   * @returns {//TODO} queried profile data
   */
  @Patch('/post')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Edit Post Request Done!' })
  @ApiResponse({ status: 400, description: 'Edit Post Failed!' })
  async editPost(
    @Body() postContent: EditPostPayload,
    @Req() request: any,
  ): Promise<IGenericMsgBody> {
    postContent.userId = request.user._id;
    const editedPost = await this.commService.editPost(postContent);
    if (!editedPost) {
      throw new BadRequestException('Failed to post in Board');
    }
    return {
      statusCode: 201,
      message: '커뮤니티 게시글 수정 완료',
    };
  }

  @Delete('/post/:postId')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Edit Post Request Done!' })
  @ApiResponse({ status: 400, description: 'Edit Post Failed!' })
  async deletePost(@Param('postId') postId: string): Promise<any> {
    const deletedPost = await this.commService.deletePost(postId);
    // TODO: output type 정해서 바꾸기
    if (!deletedPost) {
      throw new BadRequestException('Failed to delete post');
    }
    return {
      statusCode: 201,
      message: '커뮤니티 게시글 삭제 완료',
    };
  }

  @Get('/post/:postId')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'Getting Post Detail Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Getting Post Detail Failed',
  })
  async getPostDetail(
    @Req() { user }: any,
    @Param('postId') postId: string,
  ): Promise<IGenericMsgBody> {
    const postInfo = await this.commService.detailPost(user._id, postId);
    if (!postInfo) {
      throw new BadRequestException('No boards in Database.');
    }
    return { statusCode: 200, message: '게시글 정보 확인', data: postInfo };
  }

  /**
   * @param CreateCommentPayload the profile given username to fetch
   * @returns {//TODO} output type
   */
  @Post('/comment')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Create New Comment Request Done!' })
  @ApiResponse({ status: 400, description: 'Create New Comment Failed!' })
  async createComment(
    @Body() commentContent: CreateCommentPayload,
    @Req() request: any,
  ): Promise<IGenericMsgBody> {
    commentContent.userId = request.user._id;
    const newPostInfo = await this.commService.createComment(commentContent);
    if (!newPostInfo) {
      throw new BadRequestException('Failed to comment in Board');
    }
    return {
      statusCode: 201,
      message: '댓글 생성 완료',
    };
  }

  /**
   * @param DeleteCommentPayload the profile given username to fetch
   * @returns {//TODO} output type
   */
  @Delete('/comment')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 201, description: 'Delete Comment Request Done!' })
  @ApiResponse({ status: 400, description: 'Delete Comment Failed!' })
  async deleteComment(
    @Body() commentContent: DeleteCommentPayload,
  ): Promise<IGenericMsgBody> {
    const deletedPostInfo = await this.commService.deleteComment(
      commentContent,
    );
    // TODO: output type 정해서 바꾸기
    if (!deletedPostInfo) {
      throw new BadRequestException('Failed to delete comment');
    }
    return {
      statusCode: 201,
      message: '댓글 삭제 완료',
    };
  }

  @Post('/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Add Favorite Board Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Add Favorite Board Failed',
  })
  async addFavorites(
    @Req() { user }: any,
    @Body() boardId: IdPayload,
  ): Promise<IGenericMsgBody> {
    console.log('addFavorites: ', boardId);
    await this.commService.addFavorites(user._id, boardId.id);
    return { statusCode: 201, message: `Add Favorites Done` };
  }
  @Delete('/favorite')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Add Favorite Board Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Add Favorite Board Failed',
  })
  async deleteFavorites(
    @Req() { user }: any,
    @Body() boardId: IdPayload,
  ): Promise<IGenericMsgBody> {
    await this.commService.deleteFavorites(user._id, boardId.id);
    return { statusCode: 201, message: `Delete Favorites Done` };
  }

  @Post('/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Like Post Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Like Post Failed',
  })
  async addLikePost(
    @Req() { user }: any,
    @Body() postId: IdPayload,
  ): Promise<IGenericMsgBody> {
    await this.commService.addLikes(user._id, postId.id);
    return { statusCode: 201, message: `Like Post Done` };
  }

  @Delete('/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Like Post Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Like Post Failed',
  })
  async deleteLikePost(
    @Req() { user }: any,
    @Body() postId: IdPayload,
  ): Promise<IGenericMsgBody> {
    await this.commService.deleteLikes(user._id, postId.id);
    return { statusCode: 201, message: `Like Post Done` };
  }

  @Post('/scrap')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Scrap Post Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Scrap Post Failed',
  })
  async addScrapPost(
    @Req() { user }: any,
    @Body() postId: IdPayload,
  ): Promise<IGenericMsgBody> {
    await this.commService.addScraps(user._id, postId.id);
    return { statusCode: 201, message: `Scrap Post Done` };
  }

  @Delete('/scrap')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'Scrap Post Done',
  })
  @ApiResponse({
    status: 400,
    description: 'Scrap Post Failed',
  })
  async deleteScrapPost(
    @Req() { user }: any,
    @Body() postId: IdPayload,
  ): Promise<IGenericMsgBody> {
    await this.commService.deleteScraps(user._id, postId.id);
    return { statusCode: 201, message: `Scrap Post Done` };
  }
  @Get('/newPosts')
  async makeAllBoardNewPosts() {
    await this.commService.makeAllBoardNewPosts();
  }

  @Get('/http')
  async changeHttp() {
    await this.commService.updateImageUrl();
  }
}
