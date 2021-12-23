import { TestingModule } from '@nestjs/testing';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Types, Connection, Schema, ClientSession } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { Model } from 'mongoose';
import { ICity } from './model/board.model';
import { IPost } from './model/post.model';
import { AppRoles } from '../app.roles';
import {
  GetBoardInfoPayload,
  GetBoardPayload,
  PostInfoPayload,
  PostListPayload,
} from './payload/get-board-info.payload';
import {
  CreatePostPayload,
  EditPostPayload,
  PostDetailPayload,
} from './payload/post.payload';
import {
  CreateCommentPayload,
  DeleteCommentPayload,
} from './payload/comment.payload';
import { UserService } from '../user/user.service';
import { formatSimpleDateTime } from '../utils/utils';

//TODO! payload, model 이름 규칙 정하기
/**
 * Models a typical response for a crud operation
 */

@Injectable()
export class CommunityService {
  /**
   * Constructor
   * @param {Model<ICity>} boardModel
   */
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectModel('City') private readonly boardModel: Model<ICity>,
    @InjectModel('Post') private readonly postModel: mongoosePaginate<IPost>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getAllBoard(): Promise<GetBoardInfoPayload[]> {
    const allBoardInfo = await this.boardModel
      .find()
      .sort({ prov_abb: 1 })
      .lean();

    return allBoardInfo as GetBoardInfoPayload[];
  }

  async getAllBoardNearby(
    x: number,
    y: number,
  ): Promise<GetBoardInfoPayload[]> {
    const allBoardInfo = (await this.boardModel.find().lean()) as any;

    allBoardInfo.forEach((e) => {
      let loc = e.locations;
      let distance = (x - loc.x) * (x - loc.x) + (y - loc.y) * (y - loc.y);
      e.distance = distance;
    });
    allBoardInfo.sort((a, b) =>
      a.distance > b.distance ? 1 : b.distance > a.distance ? -1 : 0,
    );
    return allBoardInfo.slice(0, 4) as GetBoardInfoPayload[];
  }

  async getAllBoardFavorite(userId: string): Promise<GetBoardInfoPayload[]> {
    const favorites = await this.userService.getUserByAttributes(
      userId,
      'favorites',
    );

    const favoriteBoardInfo = await this.boardModel
      .find({ _id: { $in: favorites } })
      .lean();
    return favoriteBoardInfo as GetBoardInfoPayload[];
  }

  async getBoard(
    userId: string,
    boardId: string,
    pageNum: number,
  ): Promise<GetBoardPayload> {
    const postList = (
      await this.postModel.paginate(
        { boardId: boardId }, // Query
        {
          sort: { createdTime: -1 }, // 최신 순 정렬
          limit: 10000, // 개수 제한
          page: pageNum, // 페이지 번호
        },
      )
    ).docs;
    const reports: string[] = (await this.userService.get(userId.toString()))
      .reports;
    const isFavorite = await this.userService.inquiryFavorite(userId, boardId);
    const posts = [];
    postList.forEach((element: PostInfoPayload) => {
      if (!reports.includes(element.userId.toString())) {
        posts.push({
          _id: element._id,
          userId: element.userId,
          mine: element.userId.toString() == userId ? true : false,
          admin:
            element.userId.toString() == '61756ba6726cae00210c52b1'
              ? true
              : false,
          title: element.title,
          commentsCount: element.comments.length,
          likesCount: element.likes.length,
          scrapsCount: element.scraps.length,
          createdTime: formatSimpleDateTime(element.createdTime),
        });
      }
    });

    const result: GetBoardPayload = { isFavorite: isFavorite, posts: posts };

    return result;
  }

  async createPost(content: CreatePostPayload) {
    const session = await this.connection.startSession();
    let newPostId;
    await session.withTransaction(async () => {
      newPostId = await this.postModel.create([content], { session: session });
      await this.boardModel
        .findByIdAndUpdate(content.boardId, {
          $set: { first_article: content.title },
        })
        .session(session);
      await this.userService.addPost(content.userId, newPostId[0]._id);
    });
    session.endSession();
    return newPostId;
  }

  async editPost(content: EditPostPayload) {
    const editedPost = await this.postModel.findByIdAndUpdate(
      content.postId,
      {
        title: content.title,
        content: content.content,
      },
      { new: true },
    );
    return editedPost;
  }

  async deletePost(postId: string): Promise<IPost | null> {
    // 유저가 게시글을 삭제하는 경우
    try {
      // 없는 id를 넣으면 에러가 나지 않고 result가 null로 반환
      const session = await this.connection.startSession();
      let result;
      await session.withTransaction(async () => {
        result = await this.postModel
          .findByIdAndDelete(postId)
          .session(session);
        await this.userService.deletePost(result.userId, postId, session);
      });
      session.endSession();
      console.log(result);
      return result;
    } catch (error) {
      console.log('In Error');
      console.log(error);
      return null;
    }
  }

  async deletePosts(postIds: string[], session: ClientSession | null = null) {
    // 유저가 탈퇴할 시 유저의 게시물 전체 삭제
    return this.postModel
      .deleteMany({
        _id: {
          $in: postIds,
        },
      })
      .session(session);
  }

  async detailPost(
    userId: Schema.Types.ObjectId,
    postId: string,
  ): Promise<PostDetailPayload> {
    const postInfo: IPost = await this.postModel.findById(postId).lean();
    const commentsInfo = [];
    const reports: string[] = (await this.userService.get(userId.toString()))
      .reports;

    postInfo.comments.forEach((element) => {
      if (!reports.includes(element.userId.toString())) {
        commentsInfo.push({
          _id: element._id,
          userId: element.userId.toString(),
          mine: element.userId.toString() == userId.toString() ? true : false,
          admin:
            element.userId.toString() == '61756ba6726cae00210c52b1'
              ? true
              : false,
          postOwner:
            element.userId.toString() == postInfo.userId.toString()
              ? true
              : false,
          content: element.content,
          createdTime: formatSimpleDateTime(element.createdTime),
        });
      }
    });

    const postDetail: PostDetailPayload = {
      postId: postId,
      userId: postInfo.userId.toString(),
      mine: userId.toString() == postInfo.userId.toString() ? true : false,
      admin:
        postInfo.userId.toString() == '61756ba6726cae00210c52b1' ? true : false,
      title: postInfo.title,
      content: postInfo.content,
      likesCount: postInfo.likes ? postInfo.likes.length : 0,
      scrapsCount: postInfo.scraps ? postInfo.scraps.length : 0,
      commentsCount: postInfo.comments ? postInfo.comments.length : 0,
      like: postInfo.likes
        ? postInfo.likes
            .map((user) => user.toString())
            .includes(userId.toString())
        : false,
      scrap: postInfo.scraps
        ? postInfo.scraps
            .map((user) => user.toString())
            .includes(userId.toString())
        : false,
      comments: commentsInfo,
      createdTime: formatSimpleDateTime(postInfo.createdTime),
    };
    return postDetail;
  }

  async getPosts(userId: string) {
    const posts = await this.userService.getUserByAttributes(userId, 'posts');
    const postList = [];
    const postInfo = await this.postModel.find({ _id: { $in: posts } }).lean();
    await postInfo.forEach((element: PostInfoPayload) => {
      postList.push({
        ...element,
        createdTime: formatSimpleDateTime(element.createdTime),
        mine: element.userId.toString() == userId,
        admin:
          element.userId.toString() == '61756ba6726cae00210c52b1'
            ? true
            : false,
      });
    });
    return postList as PostListPayload[];
  }

  async createComment(content: CreateCommentPayload) {
    const session = await this.connection.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await this.postModel
        .findByIdAndUpdate(
          content.postId,
          {
            $push: {
              comments: { userId: content.userId, content: content.content },
            },
          },
          { new: true },
        )
        .session(session);
      const commentIds = [];
      result.comments.forEach((x) => {
        commentIds.push(x._id);
      });
      await this.userService.addComment(content.userId, commentIds, session);
    });
    session.endSession();
    return result._id;
  }

  async deleteComment(content: DeleteCommentPayload) {
    const session = await this.connection.startSession();
    console.log(content);
    let newPostInfo;
    await session.withTransaction(async () => {
      newPostInfo = await this.postModel
        .findByIdAndUpdate(
          content.postId,
          {
            $pull: {
              comments: { _id: content.commentId },
            },
          },
          { new: true },
        )
        .session(session);
      await this.userService.deleteComment(
        content.userId,
        content.commentId,
        session,
      );
    });
    session.endSession();
    return newPostInfo;
  }

  async getComments(userId: string) {
    const comments = await this.userService.getUserByAttributes(
      userId,
      'comments',
    );
    const commentList = [];
    const commentInfo = await this.postModel
      .find({ 'comments._id': { $in: comments } })
      .lean();
    await commentInfo.forEach((element: PostInfoPayload) => {
      commentList.push({
        ...element,
        createdTime: formatSimpleDateTime(element.createdTime),
        mine: element.userId.toString() == userId,
        admin:
          element.userId.toString() == '61756ba6726cae00210c52b1'
            ? true
            : false,
      });
    });
    return commentList as PostListPayload[];
  }

  async addFavorites(userId: string, boardId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.userService.addFavorites(userId, boardId, session);
    });
    session.endSession();
  }

  async addScraps(userId: string, postId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.postModel
        .findByIdAndUpdate(postId, {
          $addToSet: { scraps: Types.ObjectId(userId) },
        })
        .session(session);
      await this.userService.addScraps(userId, postId, session);
    });
    session.endSession();
  }

  async addLikes(userId: string, postId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.postModel
        .findByIdAndUpdate(postId, {
          $addToSet: { likes: Types.ObjectId(userId) },
        })
        .session(session);
      await this.userService.addLikes(userId, postId, session);
    });
    session.endSession();
  }

  async deleteFavorites(userId: string, boardId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.userService.deleteFavorites(userId, boardId, session);
    });
    session.endSession();
  }

  async deleteScraps(userId: string, postId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.postModel
        .findByIdAndUpdate(postId, {
          $pull: { scraps: Types.ObjectId(userId) },
        })
        .session(session);
      await this.userService.deleteScraps(userId, postId, session);
    });
    session.endSession();
  }

  async deleteLikes(userId: string, postId: string) {
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.postModel
        .findByIdAndUpdate(postId, {
          $pull: { likes: Types.ObjectId(userId) },
        })
        .session(session);
      await this.userService.deleteLikes(userId, postId, session);
    });
    session.endSession();
  }

  async getLikes(userId: string) {
    const likes = await this.userService.getUserByAttributes(userId, 'likes');
    const likeList = [];
    const likePostInfo = await this.postModel
      .find({ _id: { $in: likes } })
      .lean();
    await likePostInfo.forEach((element: PostInfoPayload) => {
      likeList.push({
        ...element,
        createdTime: formatSimpleDateTime(element.createdTime),
        mine: element.userId.toString() == userId,
        admin:
          element.userId.toString() == '61756ba6726cae00210c52b1'
            ? true
            : false,
      });
    });
    return likeList as PostListPayload[];
  }

  async getScraps(userId: string) {
    const scraps = await this.userService.getUserByAttributes(userId, 'scraps');
    const scrapList = [];
    const scrapPostInfo = await this.postModel
      .find({ _id: { $in: scraps } })
      .lean();
    await scrapPostInfo.forEach((element: PostInfoPayload) => {
      scrapList.push({
        ...element,
        createdTime: formatSimpleDateTime(element.createdTime),
        mine: element.userId.toString() == userId,
        admin:
          element.userId.toString() == '61756ba6726cae00210c52b1'
            ? true
            : false,
      });
    });
    return scrapList as PostListPayload[];
  }

  async deleteAllLikes4User(
    userId: Schema.Types.ObjectId,
    postIds: string[],
    session: ClientSession | null = null,
  ) {
    return this.postModel
      .updateMany({ _id: { $in: postIds } }, { $pull: { likes: userId } })
      .session(session);
  }

  async deleteAllComments4User(
    commentIds: string[],
    session: ClientSession | null = null,
  ) {
    return this.postModel
      .updateMany({
        $pull: {
          comments: {
            _id: {
              $in: commentIds,
            },
          },
        },
      })
      .session(session);
  }

  async makeAllBoardNewPosts() {
    const board = await this.boardModel.find().lean();
    const now = new Date();
    board.forEach((e) => {
      let content: CreatePostPayload = {
        boardId: e._id.toString(),
        title: '커뮤니티 이용규칙',
        content:
          '커뮤니티 이용규칙\n\nLastDay는 누구나 기분좋게 이용할 수 있는 커뮤니티를 만들기 위해 커뮤니티 이용규칙을 제정하여 운영하고 있습니다. 회원분들께서는 커뮤니티 이용 전 이용규칙을 반드시 숙지하시길 부탁드립니다.\n\nLastDay의 커뮤니티 이용자는 방송통신심의위원회의 정보통신에 관한 심의규정, 현행 법률, 서비스 이용 약관 및 커뮤니티 이용규칙을 위반하거나 타 이용자에게 악영향을 끼치는 경우, 게시물 삭제 조치가 이뤄질 수 있습니다.\n\n또한 커뮤니티 내에서 다른 서비스 및 상품을 홍보하는 행위, 영리적 이익을 추구하는 행위, 타 이용자를 기망하여 손해를 끼치는 행위 등은 엄격하게 단속하여, 최소 게시글 삭제에서 회원 자격 정지까지의 조치가 이뤄질 수 있습니다.',
        createdTime: now,
        userId: '61756ba6726cae00210c52b1',
      };
      let result = this.createPost(content);
      console.log(result);
    });
  }

  async updateImageUrl() {
    const info = [
      { province: '특별시', city: '서울특별시', number: 1 },
      { province: '특별시', city: '부산광역시', number: 2 },
      { province: '특별시', city: '대구광역시', number: 3 },
      { province: '특별시', city: '인천광역시', number: 4 },
      { province: '특별시', city: '광주광역시', number: 5 },
      { province: '특별시', city: '대전광역시', number: 6 },
      { province: '특별시', city: '울산광역시', number: 7 },
      { province: '특별시', city: '세종특별자치시', number: 8 },
      { province: '경기도', city: '고양시', number: 9 },
      { province: '경기도', city: '과천시', number: 10 },
      { province: '경기도', city: '광명시', number: 11 },
      { province: '경기도', city: '광주시', number: 12 },
      { province: '경기도', city: '구리시', number: 13 },
      { province: '경기도', city: '김포시', number: 14 },
      { province: '경기도', city: '남양주시', number: 15 },
      { province: '경기도', city: '부천시', number: 16 },
      { province: '경기도', city: '성남시', number: 17 },
      { province: '경기도', city: '수원시', number: 18 },
      { province: '경기도', city: '시흥시', number: 19 },
      { province: '경기도', city: '안산시', number: 20 },
      { province: '경기도', city: '안성시', number: 21 },
      { province: '경기도', city: '안양시', number: 22 },
      { province: '경기도', city: '양주시', number: 23 },
      { province: '경기도', city: '여주시', number: 24 },
      { province: '경기도', city: '오산시', number: 25 },
      { province: '경기도', city: '용인시', number: 26 },
      { province: '경기도', city: '의정부시', number: 27 },
      { province: '경기도', city: '이천시', number: 28 },
      { province: '경기도', city: '파주시', number: 29 },
      { province: '경기도', city: '평택시', number: 30 },
      { province: '경기도', city: '포천시', number: 31 },
      { province: '경기도', city: '화성시', number: 32 },
      { province: '강원도', city: '강릉시', number: 33 },
      { province: '강원도', city: '동해시', number: 34 },
      { province: '강원도', city: '삼척시', number: 35 },
      { province: '강원도', city: '속초시', number: 36 },
      { province: '강원도', city: '원주시', number: 37 },
      { province: '강원도', city: '춘천시', number: 38 },
      { province: '강원도', city: '태백시', number: 39 },
      { province: '충청북도', city: '제천시', number: 40 },
      { province: '충청북도', city: '청주시', number: 41 },
      { province: '충청북도', city: '충주시', number: 42 },
      { province: '충청남도', city: '계룡시', number: 43 },
      { province: '충청남도', city: '공주시', number: 44 },
      { province: '충청남도', city: '논산시', number: 45 },
      { province: '충청남도', city: '당진시', number: 46 },
      { province: '충청남도', city: '보령시', number: 47 },
      { province: '충청남도', city: '서산시', number: 48 },
      { province: '충청남도', city: '아산시', number: 49 },
      { province: '충청남도', city: '천안시', number: 50 },
      { province: '경상북도', city: '경산시', number: 51 },
      { province: '경상북도', city: '경주시', number: 52 },
      { province: '경상북도', city: '구미시', number: 53 },
      { province: '경상북도', city: '김천시', number: 54 },
      { province: '경상북도', city: '문경시', number: 55 },
      { province: '경상북도', city: '상주시', number: 56 },
      { province: '경상북도', city: '안동시', number: 57 },
      { province: '경상북도', city: '영주시', number: 58 },
      { province: '경상북도', city: '포항시', number: 59 },
      { province: '경상남도', city: '거제시', number: 60 },
      { province: '경상남도', city: '김해시', number: 61 },
      { province: '경상남도', city: '밀양시', number: 62 },
      { province: '경상남도', city: '사천시', number: 63 },
      { province: '경상남도', city: '양산시', number: 64 },
      { province: '경상남도', city: '진주시', number: 65 },
      { province: '경상남도', city: '창원시', number: 66 },
      { province: '경상남도', city: '통영시', number: 67 },
      { province: '전라북도', city: '군산시', number: 68 },
      { province: '전라북도', city: '김제시', number: 69 },
      { province: '전라북도', city: '남원시', number: 70 },
      { province: '전라북도', city: '익산시', number: 71 },
      { province: '전라북도', city: '전주시', number: 72 },
      { province: '전라북도', city: '정읍시', number: 73 },
      { province: '전라남도', city: '광양시', number: 74 },
      { province: '전라남도', city: '나주시', number: 75 },
      { province: '전라남도', city: '목포시', number: 76 },
      { province: '전라남도', city: '순천시', number: 77 },
      { province: '전라남도', city: '여수시', number: 78 },
      { province: '제주', city: '서귀포시', number: 79 },
      { province: '제주', city: '제주시', number: 80 },
    ];
    const allBoard = await this.boardModel.find().lean();
    allBoard.forEach(async (e) => {
      info.forEach(async (x) => {
        if (x.province == e.province && x.city == e.city) {
          let newImage =
            'https://example.com' +
            x.number +
            '.jpg';
          console.log(e.province, e.city, newImage);
          await this.boardModel
            .findByIdAndUpdate(e._id, {
              $set: { image: newImage },
            })
            .lean();
        }
      });
    });
  }
}
