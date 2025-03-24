import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordDto, RestPasswordDto, SignInDto } from '../dtos/signIn.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { emailverification } from 'src/Email/verification';
import { generateUniqueKey, UtilService } from 'src/utils/utils.function';
import { RateLimiterMemory } from 'rate-limiter-flexible'

@Injectable()
export class AuthService {
  private rateLimiter = new RateLimiterMemory({
    points: 5, 
    duration: 60, 
  });
  constructor(
    private utilService: UtilService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

  ) { }
  public async signIn(signInDto: SignInDto) {
    console.log(signInDto);
    return signInDto;
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<any> {
    try {
      await this.rateLimiter.consume(dto.email);
      const email = dto.email.toLowerCase();
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = generateUniqueKey(6);
      user.resetToken = resetToken;
      user.tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

      await this.userRepository.save(user);
      await emailverification({
        name: user.firstName || email.split('@')[0],
        email: user.email,
        code: resetToken,
        type: 'Reset Token',
      });

      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Reset code sent to your email',
      };
    } catch (error) {
      console.error('Forgot Password Error:', error);
      throw error;
    }
  }

  async resetPassword(dto: RestPasswordDto): Promise<any> {
    try {
      if(!dto.token || dto.token == ' ' ){
        throw new BadRequestException('A valid token is required');
      }
      const user = await this.userRepository.findOne({ where: { resetToken: dto.token } });

      if (!user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (user.tokenExpires && user.tokenExpires < new Date()) {
        throw new BadRequestException('Reset token has expired. Please request a new one.');
      }

      if (!dto.newpassword) {
        throw new BadRequestException('New password is required');
      }

      const isSameAsCurrent = await this.utilService.confirmPassword(dto.newpassword, user.password);
      if (isSameAsCurrent) {
        throw new BadRequestException('You cannot reset your password to the current one');
      }

      user.password = await this.utilService.hashPassword(dto.newpassword);
      user.resetToken = null;

      await this.userRepository.save(user);

      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Password reset successful',
      };
    } catch (error) {
      throw error;
    }
  }

}
