import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '/api/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'email', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;
    
    const user = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value,
      name: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : '',
      picture: photos?.[0]?.value,
      accessToken,
    };

    done(null, user);
  }
}

