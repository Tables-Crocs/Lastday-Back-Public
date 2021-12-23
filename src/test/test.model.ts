import { Schema, Document } from 'mongoose';

/**
 * Mongoose Profile Schema
 * 컬렉션에 들어가는 문서 내부의 각 필드 스키마를 정의
 */
export const Test = new Schema({
  username: { type: String, required: true },
  email: String,
});

export interface ITest extends Document {
  readonly _id: Schema.Types.ObjectId;
  readonly username: string;
  readonly email: string;
}
