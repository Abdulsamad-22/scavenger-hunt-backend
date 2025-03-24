import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { ForgotPasswordDto, RestPasswordDto, SignInDto } from './dtos/signIn.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('sign-in')
  public signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('forgot-password')
  public async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset/password')
  public async restPassword(@Body() dto: RestPasswordDto) {
    return this.authService.resetPassword(dto);
  }


}
