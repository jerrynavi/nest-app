import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { sendMail } from 'src/util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface LoginData {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  public async login(data: LoginData): Promise<Partial<User>> {
    try {
      const { username } = data;
      const user = await this.userService.findUser(username);

      if (!user) {
        throw new BadRequestException('User with that username does not exist.');
      }

      const isValidPass = await this.compareHash(data.password, user.password);

      if (!isValidPass) {
        throw new BadRequestException('Invalid password');
      }

      const {
        password,
        passwordResetCode,
        ...userData
      } = user;

      return userData;

    } catch (error) {
      throw new HttpException(error.message ?? 'Couldn\'t sign you in.', error.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  public async signup(user: User): Promise<Partial<User>> {
    try {
      const resetCode = this.generatePassResetCode();
      const hashedPass = await this.getHash(user.password);

      const saved = await this.userService.addUser({
        ...user,
        password: hashedPass,
        passwordResetCode: resetCode,
      });

      const {
        password,
        passwordResetCode,
        ...newUser
      } = saved;

      sendMail(
        `Welcome to my app, ${user.username}`,
        'Welcome!',
        user.email,
      );

      return newUser;

    } catch (error) {
      throw new HttpException(error.message ?? 'Failed to create account.', error.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  public async requestResetCode(email: string): Promise<{ message: string; }> {
    try {
      const user = await this.userRepository.findOne({
        email,
      });
      if (!user) {
        throw new BadRequestException('Email does not exist.')
      }

      const { passwordResetCode, username } = user;

      const message = `Hello, ${username},
        <br /><br />
        Your password reset code is ${passwordResetCode}.
        <br /><br />
      `;

      sendMail(message, 'Password Reset Code', email);

      return {
        message: 'Please check your email for the reset code',
      };

    } catch (error) {
      throw new HttpException(error.message ?? 'Failed to create account.', error.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  public async resetPassword(data: {
    email: string;
    newPassword: string;
    passwordResetCode: string;
  }): Promise<{ message: string; }> {
    try {
      const { email, newPassword, passwordResetCode } = data;
      const user = await this.userRepository.findOne({
        email,
      });
      if (!user) {
        throw new BadRequestException('User with that email does not exist.');
      }

      if (passwordResetCode != user.passwordResetCode) {
        throw new BadRequestException('Password reset code is invalid.');
      }

      const hashedPass = await this.getHash(newPassword);
      const newResetCode = this.generatePassResetCode();
      const message = `Hi, ${user.username},
        <br /><br />
        Your password at our website was reset. If you made this change you can safely ignore this email. Otherwise, get in touch with our support staff.
        <br /><br />
        Cheers!
      `;

      sendMail(message, 'Password Change Notification', user.email);

      await this.userRepository.update({
        email,
      }, {
        password: hashedPass,
        passwordResetCode: newResetCode,
      });

      return {
        message: 'Password reset successfully. You can login with your new details now.',
      };
      
    } catch (error) {
      throw new HttpException(error.message ?? 'Failed to create account.', error.status ?? HttpStatus.BAD_REQUEST);
    }
  }

  private generatePassResetCode(): string {
    return randomBytes(6).toString('hex');
  }

  private getHash(data: string): Promise<string> {
    return bcrypt.hash(data, 8);
  }

  private compareHash(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }
}