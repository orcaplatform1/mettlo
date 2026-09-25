import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SocialService } from './social.service';

@Module({ controllers: [AuthController], providers: [AuthService, SocialService], exports: [AuthService] })
export class AuthModule {}
