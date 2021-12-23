import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ITest } from './test.model';

/**
 * Models a typical response for a crud operation
 */
export interface IGenericMessageBody {
  message: string;
}

/**
 * Profile Service
 */
@Injectable()
export class TestService {
  /**
   * Constructor
   * @param {Model<ITest>} testModel
   */
  constructor(@InjectModel('Test') private readonly testModel: Model<ITest>) {}

  /**
   * Fetches a profile from database by UUID
   * @param {string} id
   * @returns {Promise<ITest>} queried profile data
   */
  get(id: string): Promise<ITest> {
    return this.testModel.findById(id).exec();
  }

  /**
   * Fetches a profile from database by username
   * @param {string} username
   * @returns {Promise<ITest>} queried profile data
   */
  getByUsername(username: string): Promise<ITest> {
    return this.testModel.findOne({ username }).exec();
  }

  insertByUsername(username: string) {
    // console.log(username, this.testModel.);
    const newModel = new this.testModel({
      username: username,
    });
    newModel.save();
  }

  /**
   * Delete profile given a username
   * @param {string} username
   * @returns {Promise<IGenericMessageBody>} whether or not the crud operation was completed
   */
  async delete(username: string): Promise<IGenericMessageBody> {
    const profile = await this.testModel.deleteOne({ username });
    if (profile.deletedCount === 1) {
      return { message: `Deleted ${username} from records` };
    } else {
      throw new BadRequestException(
        `Failed to delete a profile by the name of ${username}.`,
      );
    }
  }
}
