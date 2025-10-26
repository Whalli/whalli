import { UserSafe } from '@whalli/utils';

export class AuthResponseDto {
  user: UserSafe;
  accessToken: string;
  refreshToken: string;
}
