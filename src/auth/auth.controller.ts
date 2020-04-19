import { Controller, Post, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
  ) { }

  @Post('login')
  async login(@Req() req: Request) {
    return this.service.login(req.body);
  }

  @Post('signup')
  async signup(@Req() req: Request) {
    return this.service.signup(req.body);
  }

  @Get('request-reset/:email')
  async requestReset(@Req() req: Request) {
    return this.service.requestResetCode(req.params.email);
  }

  @Post('reset-pass')
  async resetPassword(@Req() req: Request) {
    return this.service.resetPassword(req.body);
  }
}