import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as sgMail from '@sendgrid/mail';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { ConfigService } from '../config/config.service';
import { IGenericMsgBody } from '../config/payload/response.generic';
import { IUser } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { SignInPayload } from './payload/signin.payload';
import { SignUpPayload } from './payload/signup.payload';

/**
 * Models a typical Login/Register route return body
 */
export interface ITokenReturnBody {
  /**
   * When the token is to expire in seconds
   */
  expires: string;
  /**
   * A human-readable format of expires
   */
  expiresPrettyPrint: string;
  /**
   * The Bearer token
   */
  token: string;
}

/**
 * Authentication Service
 */
@Injectable()
export class AuthService {
  /**
   * Time in seconds when the token is to expire
   * @type {string}
   */
  private readonly expiration: string;
  private readonly from_email: string;
  private readonly template_path: string;

  /**
   * Constructor
   * @param {JwtService} jwtService jwt service
   * @param {ConfigService} configService
   * @param {UserService} userService profile service
   */
  constructor(
    // @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.expiration = this.configService.get('WEBTOKEN_EXPIRATION_TIME');
    sgMail.setApiKey(this.configService.get('SG_API_KEY'));
    this.from_email = this.configService.get('SG_EMAIL');
    this.template_path = path.join(__dirname, '../../src/config/templates');
    console.log(`  Getting email template file from ${this.template_path}`);
  }

  /**
   * Creates a signed jwt token based on IUser payload
   * @param {Profile} param dto to generate token from
   * @returns {Promise<ITokenReturnBody}
   */
  async createToken({ _id, username }: IUser): Promise<ITokenReturnBody> {
    return {
      expires: this.expiration,
      expiresPrettyPrint: AuthService.prettyPrintSeconds(this.expiration),
      token: this.jwtService.sign({ _id, username }),
    };
  }

  /**
   * Formats the time in seconds into human-readable format
   * @param {string} time
   * @returns {string} hrf time
   */
  private static prettyPrintSeconds(time: string): string {
    const ntime = Number(time);
    const hours = Math.floor(ntime / 3600);
    const minutes = Math.floor((ntime % 3600) / 60);
    const seconds = Math.floor((ntime % 3600) % 60);

    return `${hours > 0 ? hours + (hours === 1 ? ' hour,' : ' hours,') : ''} ${
      minutes > 0 ? minutes + (minutes === 1 ? ' minute' : ' minutes') : ''
    } ${seconds > 0 ? seconds + (seconds === 1 ? ' second' : ' seconds') : ''}`;
  }

  /**
   * Validates whether or not the profile exists in the database
   * @param {LoginPayload} payload login payload to authenticate with
   * @returns {Promise<IProfile>} registered profile
   */
  async validateUser(payload: SignInPayload): Promise<IUser> {
    const user = await this.userService.getByUsernameAndPass(
      payload.username,
      payload.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Could not authenticate. Please try again.',
      );
    }
    return user;
  }

  /**
   * Validates whether or not the profile exists in the database
   * @param {LoginPayload} payload login payload to authenticate with
   * @returns {Promise<IProfile>} registered profile
   */
  async validateAndCreate(payload: SignUpPayload): Promise<IGenericMsgBody> {
    let user = await this.userService.getByUsernameAndPass(
      payload.username,
      payload.password,
    );

    let isNew = false;
    if (!user) {
      // user not found
      user = await this.userService.create(payload);
      isNew = true;
    }
    if (!user.isVerified) {
      const token = isNew
        ? user.verificationToken
        : await this.userService.regenerateVerificationToken(user._id);
      const result = await this.emailVerification(user.username, token);

      return {
        statusCode: isNew ? 202 : 205,
        message: isNew
          ? '인증코드가 이메일로 발송 되었습니다'
          : '인증코드가 이메일로 재발송 되었습니다',
        data: result,
      };
    }
    const data = await this.createToken(user);
    return {
      statusCode: isNew ? 201 : 200,
      message: isNew
        ? `새로운 유저가 생성되었습니다`
        : `기존 유저로 로그인합니다`,
      data: {
        ...data,
        name: user.name,
        isNew: isNew,
      },
    };
  }

  async emailVerification(email: string, token: string) {
    var source = await fs.readFileSync(
      path.join(this.template_path, 'emailTemplate.hbs'),
      'utf8',
    );
    var template = Handlebars.compile(source);
    const contents = await template({
      messageType: `하단의 인증 코드를 어플에 입력해서 인증을 완료해주세요`,
      message: `인증 코드 ${token}`,
    });
    const result = await sgMail.send({
      to: email,
      from: this.from_email,
      subject: '[LastDay] 이메일 인증 요청',
      text: '[LastDay] 이메일 인증 요청',
      html: contents,
    });

    return result;
  }

  async verifyEmail(username: string, token: string) {
    const user = await this.userService.verifyEmail(username, token);
    if (!user) {
      throw new BadRequestException(
        '존재하지 않는 유저입니다. 유저 ID를 확인하시기 바랍니다.',
      );
    }
    const data = await this.createToken(user);
    return {
      statusCode: 201,
      message: `새로운 유저가 생성되었습니다`,
      data: {
        ...data,
        name: user.name,
        isNew: true,
      },
    };
  }
}
