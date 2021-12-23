import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IStation } from './model/station.model';

@Injectable()
export class StationService {
  constructor(
    @InjectModel('Station') private readonly stationsModel: Model<IStation>,
  ) {}

  async getAllStations(): Promise<IStation[]> {
    return (await this.stationsModel.find().lean()) as IStation[];
  }

  async search(keyword: string) {
    const result = await this.stationsModel
      .find({
        station: { $regex: keyword, $options: 'i' },
      })
      .lean();
    return result;
  }
}
