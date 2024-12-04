import { AuthResult } from './auth-result';

export interface Authenticator {
  authenticate(): Promise<AuthResult>;
}
