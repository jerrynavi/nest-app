import { Controller, Get, Req, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(
    private readonly service: UserService,
  ) { }

  @Get('')
  async getAllUsers() {
    return this.service.getAllUsers();
  }

  @Get(':username')
  async findOne(@Req() req: Request) {
    const user = await this.service.findUser(req.params.username);
    if (!user) {
      throw new NotFoundException('No user with that username exists.');
    }
    const {
      password,
      passwordResetCode,
      ...userData
    } = user;
    return userData;
  }
}
