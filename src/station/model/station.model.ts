import { Schema, Document } from 'mongoose';
import { LocationInfo } from '../../community/model/board.model';

export enum StationType {
  TRAIN = 'TRAIN',
  AIRPORT = 'AIRPORT',
  BUS = 'BUS',
}

/**
 * Mongoose User Schema
 */
export const Station = new Schema({
  station: { type: String, required: true },
  station_info: { type:String, required: true },
  location: { type: LocationInfo, required: true }
});

/**
 * Mongoose User Document
 */
export interface IStation extends Document {
  /**
   * station ID
   */
  readonly _id: Schema.Types.ObjectId;
  /**
   * station name
   */
  readonly station: string;
  /**
   * station info
   */
  readonly station_info: StationType;
  /**
   * location
   */
   readonly location: {
        x: number;
        y: number;
    };
}
