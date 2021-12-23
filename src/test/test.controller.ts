import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TestService, IGenericMessageBody } from './test.service';
import { ITest } from './test.model';

/**
 * Profile Controller
 */
@Controller('test')
export class TestController {
  /**
   * Constructor
   * @param testService
   */
  constructor(private readonly testService: TestService) {}
  /**
   * Retrieves a particular profile
   * @param username the profile given username to fetch
   * @returns {Promise<ITest>} queried profile data
   */
  @Get(':username')
  async getTest(@Param('username') username: string): Promise<ITest> {
    const test = await this.testService.getByUsername(username);
    if (!test) {
      throw new BadRequestException(
        'The profile with that username could not be found.',
      );
    }
    return test;
  }

  //   /**
  //    * Edit a profile
  //    * @param {RegisterPayload} payload
  //    * @returns {Promise<ITest>} mutated profile data
  //    */
  //   @Patch()
  //   async patchProfile(@Body() payload: PatchProfilePayload) {
  //     return await this.testService.edit(payload);
  //   }

  /**
   * Removes a profile from the database
   * @param {string} username the username to remove
   * @returns {Promise<IGenericMessageBody>} whether or not the profile has been deleted
   */
  @Delete(':username')
  async delete(
    @Param('username') username: string,
  ): Promise<IGenericMessageBody> {
    return await this.testService.delete(username);
  }
}
