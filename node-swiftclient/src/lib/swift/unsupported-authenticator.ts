import { AuthResult } from '../interfaces/auth-result';
import { Authenticator } from '../interfaces/authenticator';

export class UnsupportedAuthenticator implements Authenticator {
  constructor(private readonly authVersion: number) {}

  authenticate(): Promise<AuthResult> {
    throw new Error(`Auth version  ${this.authVersion} not supported`);
  }
}
