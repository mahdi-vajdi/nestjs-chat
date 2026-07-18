import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import {
  AUTH_CONFIG_TOKEN,
  IAuthConfig,
} from '@auth/infrastructure/configs/auth.config';

@Injectable()
export class TokenService {
  private readonly authConfig: IAuthConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.authConfig = this.configService.get<IAuthConfig>(AUTH_CONFIG_TOKEN);
  }

  async signAccessToken(userId: string, role: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        role: role,
      },
      {
        privateKey: this.authConfig.accessPrivateKey,
        expiresIn: '1d',
      },
    );
  }

  async signRefreshToken(
    userId: string,
  ): Promise<{ token: string; jti: string }> {
    const jti = uuidV4();
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        privateKey: this.authConfig.refreshPrivateKey,
        expiresIn: '7d',
        jwtid: jti,
      },
    );

    return { token, jti };
  }

  async verifyAccessToken<T extends object = any>(token: string): Promise<T> {
    return await this.jwtService.verifyAsync<T>(token, {
      publicKey: this.authConfig.accessPublicKey,
    });
  }

  async verifyRefreshToken<T extends object = any>(token: string): Promise<T> {
    return await this.jwtService.verifyAsync<T>(token, {
      publicKey: this.authConfig.refreshPublicKey,
    });
  }
}
