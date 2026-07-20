import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { authConfig } from '@auth/infrastructure/configs/auth.config';

@Injectable()
export class TokenService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly authConf: ConfigType<typeof authConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async signAccessToken(userId: string, role: string): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        role: role,
      },
      {
        privateKey: this.authConf.accessPrivateKey,
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
        privateKey: this.authConf.refreshPrivateKey,
        expiresIn: '7d',
        jwtid: jti,
      },
    );

    return { token, jti };
  }

  async verifyAccessToken<T extends object = any>(token: string): Promise<T> {
    return await this.jwtService.verifyAsync<T>(token, {
      publicKey: this.authConf.accessPublicKey,
    });
  }

  async verifyRefreshToken<T extends object = any>(token: string): Promise<T> {
    return await this.jwtService.verifyAsync<T>(token, {
      publicKey: this.authConf.refreshPublicKey,
    });
  }
}
