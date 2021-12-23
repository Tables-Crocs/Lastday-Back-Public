import { Schema, Document } from 'mongoose';
import { AppRoles } from '../../app.roles';
import * as mongoosePaginate from 'mongoose-paginate-v2';

// 게시판의 정보를 저장하는 스키마
// 해당 게시판의 위치와 게시글의 id만 가지고 있음
const PostComment = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  createdTime: {
    type: Date,
    default: Date.now,
  },
});

export const postSchema = new Schema({
  /* Define Community schema*/
  boardId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  comments: [{ type: PostComment, required: false }],
  likes: [{ type: Schema.Types.ObjectId, required: false }],
  scraps: [{ type: Schema.Types.ObjectId, required: false }],
  createdTime: {
    type: Date,
    default: Date.now,
  },
});
postSchema.plugin(mongoosePaginate);
export const Post = postSchema;

export interface IPost extends Document {
  /* Define Community schema*/
  readonly _id: Schema.Types.ObjectId;
  readonly boardId: Schema.Types.ObjectId;
  readonly userId: Schema.Types.ObjectId;
  title: string;
  content: string;
  comments: [
    {
      _id: Schema.Types.ObjectId;
      userId: Schema.Types.ObjectId;
      content: string;
      createdTime: Date;
    },
  ];
  likes: Schema.Types.ObjectId[];
  scraps: Schema.Types.ObjectId[];
  readonly createdTime: Date;
  readonly roles: AppRoles;
}
