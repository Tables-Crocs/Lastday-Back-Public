import { Controller, Body, Post, UnauthorizedException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInPayload } from './payload/signin.payload';
import {
  SignUpPayload,
  VerifyEmailPayload,
  ResetPasswordPayload,
} from './payload/signup.payload';
import { UserService } from '../user/user.service';
import { IGenericMsgBody } from '../config/payload/response.generic';
/**
 * Authentication Controller
 */
@Controller('api/auth')
@ApiTags('authentication')
export class AuthController {
  /**
   * Constructor
   * @param {AuthService} authService authentication service
   * @param {UserService} userService profile service
   */
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * Login route to validate and create tokens for users
   * @param {SignInPayload} payload the login dto
   */
  @Post('login')
  @ApiResponse({ status: 201, description: 'Login Completed' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() payload: SignInPayload): Promise<IGenericMsgBody> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException(
        'Could not authenticate. Please try again.',
      );
    }
    const data = await this.authService.createToken(user);
    return {
      statusCode: 200,
      message: `유저 로그인 성공`,
      data: {
        ...data,
        name: user.name,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Registration route to create and generate tokens for users
   * @param {SignUpPayload} payload the registration dto
   */
  @Post('register')
  @ApiResponse({ status: 201, description: 'Registration Completed' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async register(@Body() payload: SignUpPayload): Promise<IGenericMsgBody> {
    const user = await this.userService.create(payload);
    const data = await this.authService.createToken(user);
    return {
      statusCode: 201,
      message: `유저 생성 성공`,
      data: data,
    };
  }

  /**
   * @param {SignUpPayload} payload
   * @param {Promise<IGenericMsgBody>}
   */
  @Post('snslogin')
  @ApiResponse({ status: 201, description: 'Registration Completed' })
  async snslogin(@Body() payload: SignUpPayload): Promise<IGenericMsgBody> {
    return await this.authService.validateAndCreate(payload);
  }

  @Post('verify')
  @ApiResponse({ status: 200, description: 'Verification Complete' })
  async verify(@Body() payload: VerifyEmailPayload): Promise<IGenericMsgBody> {
    const result = await this.authService.verifyEmail(
      payload.username,
      payload.token,
    );
    return result;
  }

  @Post('forgot')
  @ApiResponse({ status: 200, description: 'Forgot password. Reset password' })
  async resetPassword(
    @Body() payload: ResetPasswordPayload,
  ): Promise<IGenericMsgBody> {
    const result = await this.userService.edit(payload, true);
    return {
      statusCode: 205,
      message: '비밀번호가 초기화 되었습니다',
      data: result,
    };
  }
}
