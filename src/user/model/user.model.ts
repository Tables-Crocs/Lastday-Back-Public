import { number } from 'joi';
import { Schema, Document, Types } from 'mongoose';
import { AppRoles } from '../../app.roles';

export enum UserType {
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
  APPLE = 'APPLE',
  USER = 'USER',
}

export const Posts = new Schema({
  content: { type: String, required: true },
  createdTime: { type: Date, required: true },
});

export const Cities = new Schema({
  city: { type: String, required: true },
});

export const RecPlace = new Schema({
  title: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

export const Places = new Schema({
  sourceTitle: { type: String, required: true },
  destTitle: { type: String, required: true },
  contentId: { type: String, required: true },
  contentTitle: { type: String, required: true },
  content_type: { type: String, required: true },
  createdTime: {
    type: Date,
    default: Date.now,
  },
  time_taken: { type: Number, required: true },
});

/**
 * Mongoose User Schema
 */
export const User = new Schema({
  usertype: { type: String, required: true },
  username: { type: String, required: true },
  name: { type: String },
  password: { type: String, required: true },
  roles: [{ type: String }],
  date: {
    type: Date,
    default: Date.now,
  },
  favorites: [{ type: String }],
  scraps: [{ type: String }],
  likes: [{ type: String }],
  reports: [{ type: String, required: false }],
  histories: [{ type: Places }],
  posts: [{ type: String }],
  comments: [{ type: String }],
  isVerified: { type: Boolean, required: true },
  verificationToken: { type: String, required: true },
});

/**
 * Mongoose User Document
 */
export interface IUser extends Document {
  /**
   * UUID
   */
  readonly _id: Schema.Types.ObjectId;
  /**
   * User type
   */
  readonly usertype: UserType;
  /**
   * Username
   */
  readonly username: string;
  /**
   * Password
   */
  password: string;
  /**
   * name
   */
  name: string;
  /**
   * Roles
   */
  readonly roles: AppRoles;

  readonly date: Date;
  readonly favorites: string[];
  readonly scraps: string[];
  readonly likes: string[];
  readonly reports: string[];
  readonly histories?: any;
  readonly posts: string[];
  readonly comments: string[];
  readonly isVerified: boolean;
  readonly verificationToken: string;
}

export const DefaultFav = [
  '61744cf76c8f7f2b56345642', // Seoul
  '61744cfa6c8f7f2b56345643', // Busan
  '61744d116c8f7f2b56345696', // Jeju
  '61744d046c8f7f2b56345666', // Gangreung
];
