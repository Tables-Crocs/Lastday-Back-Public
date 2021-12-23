import { Schema, Document, Types } from 'mongoose';
import { AppRoles } from '../../app.roles';

// 게시판의 정보를 저장하는 스키마
// 해당 게시판의 위치와 게시글의 id만 가지고 있음
const PostInfo = new Schema({
  postId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  createdTime: {
    type: Date,
    default: Date.now,
  },
});

export const LocationInfo = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

export const City = new Schema({
  /* Define Community schema*/
  province: { type: String, required: true },
  prov_abb: { type: String, required: true },
  city: { type: String, required: true },
  abb: { type: String, required: true },
  image: { type: String, required: true },
  locations: { type: LocationInfo, required: true },
  posts: { type: PostInfo, required: false },
  first_article: { type: String, required: false },
});

export interface ICity extends Document {
  /* Define Community schema*/
  readonly _id: Types.ObjectId;
  readonly province: string;
  readonly prov_abb: string;
  readonly city: string;
  readonly abb: string;
  readonly image: string;
  readonly locations: {
    x: number;
    y: number;
  };
  posts?: any;
  readonly roles: AppRoles;
  first_article: string;
}
