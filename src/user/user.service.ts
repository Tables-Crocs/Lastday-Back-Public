import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as sgMail from '@sendgrid/mail';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { ClientSession, Connection, Model, Schema, Types } from 'mongoose';
import * as path from 'path';
import { AppRoles } from '../app.roles';
import { SignUpPayload } from '../auth/payload/signup.payload';
import { CommunityService } from '../community/community.service';
import { ConfigService } from '../config/config.service';
import { IGenericMsgBody } from '../config/payload/response.generic';
import { PlaceHistoryPayload } from '../recommend/payload/place.payload';
import { formatDateTime } from '../utils/utils';
import { DefaultFav, IUser, UserType } from './model/user.model';
import { UserPayloadPatch } from './payload/user.patch.payload';
/**
 * user Service
 */
@Injectable()
export class UserService {
  private readonly from_email: string;
  private readonly template_path: string;
  /**
   * Constructor
   * @param {Model<IUser>} userModel
   */
  constructor(
    @Inject(forwardRef(() => CommunityService))
    private readonly commService: CommunityService,
    private readonly configService: ConfigService,
    @InjectModel('User') private readonly userModel: Model<IUser>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    sgMail.setApiKey(this.configService.get('SG_API_KEY'));
    this.from_email = this.configService.get('SG_EMAIL');
    this.template_path = path.join(__dirname, '../../src/config/templates');
    console.log(`  Getting email template file from ${this.template_path}`);
  }

  // General Functions
  /**
   * Fetches a user from database by UUID
   * @param {string} id
   * @returns {Promise<IUser>} queried user data
   */
  get(id: string): Promise<IUser> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Fetches a user from database by username
   * @param {string} username
   * @returns {Promise<IUser>} queried user data
   */
  getByUsername(username: string): Promise<IUser> {
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * Fetches a user by their username and hashed password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<IUser>} queried user data
   */
  getByUsernameAndPass(username: string, password: string): Promise<IUser> {
    return this.userModel
      .findOne({
        username,
        password: crypto.createHmac('sha256', password).digest('hex'),
      })
      .exec();
  }

  // Create a User
  /**
   * Create a user with SignUpPayload fields
   * @param {SignUpPayload} payload user payload
   * @returns {Promise<IUser>} created user data
   */
  async create(payload: SignUpPayload): Promise<IUser> {
    const user = await this.getByUsername(payload.username);
    if (user) {
      throw new NotAcceptableException(
        '존재하는 아이디입니다. 다른 아이디를 사용하시기 바랍니다.',
      );
    }
    if (!UserType[payload.usertype]) {
      throw new NotAcceptableException(
        '올바른 유저 타입을 입력해주십시오. 유저 타입은 [KAKAO, NAVER, APPLE, USER] 중 하나로 설정하십시오',
      );
    }
    // this will auto assign the admin role to each created user
    const createduser = new this.userModel({
      // ...payload,
      usertype: UserType[payload.usertype],
      username: payload.username,
      name: payload.name,
      password: crypto.createHmac('sha256', payload.password).digest('hex'),
      roles: AppRoles.DEFAULT,
      favorites: DefaultFav,
      scraps: [],
      likes: [],
      histories: [],
      posts: [],
      comments: [],
      isVerified: payload.usertype === 'USER' ? false : true,
      verificationToken:
        payload.usertype === 'USER'
          ? await this.createVerificationToken()
          : 'null',
    });

    return createduser.save();
  }

  // Change User Info
  /**
   * Edit user data
   * @param {UserPayloadPatch} payload
   * @returns {Promise<IGenericMsgBody>} mutated user data
   */
  async edit(
    payload: UserPayloadPatch,
    isForgot = false,
  ): Promise<IGenericMsgBody> {
    const { username } = payload;
    console.log(username);
    const newPassword = isForgot
      ? await this.createVerificationToken(true)
      : payload.newPassword;
    console.log(`New Password is ${newPassword}`);
    if (isForgot) {
      // send email with the new password
      await this.newPassword(username, newPassword);
    } else if (payload.oldPassword) {
      const user = await this.getByUsernameAndPass(
        payload.username,
        payload.oldPassword,
      );
      if (!user) {
        throw new BadRequestException(
          `유저가 존재하지 않거나 비밀번호가 틀렸습니다.`,
        );
      }
    }
    payload = newPassword
      ? {
          ...payload,
          password: crypto.createHmac('sha256', newPassword).digest('hex'),
        }
      : payload;
    const updateduser = await this.userModel.updateOne({ username }, payload);
    console.log(updateduser);
    if (updateduser.nModified !== 1) {
      throw new BadRequestException(
        '존재하지 않는 유저입니다. 유저 ID 확인바랍니다.',
      );
    }
    return {
      statusCode: 201,
      message: `유저 정보 수정 완료`,
      data: this.getByUsername(username),
    };
  }

  // Remove User
  /**
   * Delete user given a username
   * @param {string} username
   * @returns {Promise<IGenericMessageBody>} whether or not the crud operation was completed
   */
  async delete(username: string): Promise<IGenericMsgBody> {
    const user = await this.getByUsername(username);
    if (!user) {
      throw new BadRequestException(
        `존재하지 않는 유저입니다. 유저 ID를 확인해주시기 바랍니다.`,
      );
    }
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      const deleteduser = await this.userModel
        .deleteOne({ username })
        .session(session);
      await this.commService.deletePosts(user.posts, session);
      await this.commService.deleteAllLikes4User(user._id, user.likes, session);
      await this.commService.deleteAllComments4User(user.comments, session);
    });
    session.endSession();
    console.log(user);
    return {
      statusCode: 201,
      message: `Deleted ${username} from records`,
    };
  }

  // 커뮤니티 즐겨찾기 조회
  /**
   * Delete user given a username
   * @param {string} userId
   * @returns {Promise<any>} whether or not the crud operation was completed
   */
  async getUserByAttributes(userId: string, attr: string): Promise<string[]> {
    const userAttrList = await this.userModel
      .findById(userId)
      .select(attr)
      .lean();
    return userAttrList[attr];
  }

  async inquiryFavorite(userId: string, boardId: string) {
    const isFavorite = (
      await this.userModel.findById(userId).lean()
    ).favorites.includes(boardId);

    return isFavorite as boolean;
  }

  async addFavorites(
    userId: string,
    boardId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { favorites: Types.ObjectId(boardId) },
      })
      .session(session);
  }

  async deleteFavorites(
    userId: string,
    boardId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { favorites: Types.ObjectId(boardId) },
      })
      .session(session);
  }

  async addLikes(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { likes: Types.ObjectId(postId) },
      })
      .session(session);
  }

  async deleteLikes(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { likes: Types.ObjectId(postId) },
      })
      .session(session);
  }

  async addScraps(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { scraps: Types.ObjectId(postId) },
      })
      .session(session);
  }

  async deleteScraps(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    return this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { scraps: Types.ObjectId(postId) },
      })
      .session(session);
  }

  async addHistory(
    userId: string,
    sourceTitle: string,
    destTitle: string,
    contentId: string,
    contentTitle: string,
    content_type: string,
    time_taken: number,
  ) {
    await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            histories: {
              userId: userId,
              sourceTitle: sourceTitle,
              destTitle: destTitle,
              contentId: contentId,
              contentTitle: contentTitle,
              content_type: content_type,
              time_taken: time_taken,
            },
          },
        },
        { new: true },
      )
      .lean();
  }

  async getHistory(userId: string): Promise<PlaceHistoryPayload[]> {
    console.log(userId);
    const userInfo = await this.userModel.findById(userId).select('histories');
    const results = [];
    await userInfo.histories.forEach((element: PlaceHistoryPayload) => {
      const {
        _id,
        sourceTitle,
        destTitle,
        contentId,
        contentTitle,
        content_type,
        time_taken,
      } = element;
      const { date, time } = formatDateTime(element.createdTime);
      results.push({
        _id: _id,
        sourceTitle: sourceTitle,
        destTitle: destTitle,
        contentId: contentId,
        contentTitle: contentTitle,
        content_type: content_type,
        time_taken: time_taken,
        fmtDate: date,
        fmtTime: time,
      });
    });
    return results;
  }
  async deleteHistory(userId: string, historyId: string) {
    console.log(historyId);
    const userInfo = await this.userModel.findByIdAndUpdate(userId, {
      $pull: { histories: { _id: historyId } },
    });
    return userInfo;
  }

  async addComment(
    userId: string,
    commentIds: string[],
    session: ClientSession | null = null,
  ) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: {
          comments: { $each: commentIds },
        },
      })
      .session(session);
  }

  async deleteComment(
    userId: string,
    commentId: string,
    session: ClientSession | null = null,
  ) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { comments: { _id: commentId } },
      })
      .session(session);
  }

  async addPost(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    const result = await this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: {
          posts: postId,
        },
      })
      .session(session);
    console.log(result);
  }

  async deletePost(
    userId: string,
    postId: string,
    session: ClientSession | null = null,
  ) {
    const result = await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { posts: { _id: postId } },
      })
      .session(session);
  }

  async createVerificationToken(isForgot = false) {
    if (isForgot) {
      return crypto.randomBytes(8).toString('hex');
    }
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  }

  async verifyEmail(username: string, token: string) {
    const user = await this.getByUsername(username);
    if (!user) {
      throw new BadRequestException(
        '존재하지 않는 사용자 입니다. 이메일 정보를 확인해주시기 바랍니다.',
      );
    }
    if (user.verificationToken === token) {
      const updateduser = await this.userModel.updateOne(
        { username },
        { isVerified: true },
      );
      if (updateduser.nModified !== 1) {
        throw new BadRequestException('올바르지 않은 인증 코드 입니다');
      }
      return user;
    } else {
      throw new BadRequestException('올바르지 않은 인증 코드 입니다');
    }
  }

  async regenerateVerificationToken(userId: Schema.Types.ObjectId) {
    const newToken = await this.createVerificationToken();
    const updateduser = await this.userModel.findByIdAndUpdate(userId, {
      verificationToken: newToken,
    });
    console.log(updateduser);
    return newToken;
  }

  async newPassword(email: string, password: string) {
    const user = await this.getByUsername(email);
    if (!user) {
      throw new BadRequestException(`존재하지 않는 유저입니다.`);
    }
    var source = await fs.readFileSync(
      path.join(this.template_path, 'emailTemplate.hbs'),
      'utf8',
    );
    var template = Handlebars.compile(source);
    const contents = await template({
      messageType: `발급된 비밀번호로 새로운 비밀번호를 설정해주세요`,
      message: `비밀번호 ${password}`,
    });
    const result = await sgMail.send({
      to: email,
      from: this.from_email,
      subject: '[LastDay] 비밀번호 재발급',
      text: '[LastDay] 비밀번호 재발급',
      html: contents,
    });

    return result;
  }
  async report(userId: string, reportId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { reports: reportId },
    });
  }
}
