import { BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { EmailAttachmentDTO } from './utils.dto';
const nodemailer = require('nodemailer');

dotenv.config();

export class UtilService {
  constructor(
    private jwtService: JwtService,


  ) { }

  // Function to generate JWT
  async generateJwt(user: any): Promise<string> {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload);
  }

  // Function to validate password
  async confirmPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string) {
    // Validate password length
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasNumber || !hasSpecialChar) {
      throw new BadRequestException(
        'Password must contain at least one number and one special character',
      );
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return hashedPassword;
  }


}

export const generateUniqueKey = (length = 5): string => {
  let key = '';
  for (let i = 0; i < length; i++) {
    key += Math.floor(Math.random() * 10);
  }
  return key;
};

export const sendEmail = async (
  html: string,
  subject: string,
  recipientEmail: string,
  attachments?: EmailAttachmentDTO[],
): Promise<any> => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `auth" <${process.env.EMAIL_ADMIN}>`,
      to: recipientEmail,
      subject,
      html,
      attachments,
    });

    console.log(`✅ Email sent successfully: ${info.messageId}`);

    return {
      message: `Nodemailer sent message: ${info.messageId}`,
      code: HttpStatus.OK,
      success: true,
    };
  } catch (error) {
    console.error(`❌ Email sending failed:`, error);
    return {
      success: false,
      message: 'Email not sent',
      code: HttpStatus.BAD_GATEWAY,
    };
  }
};
