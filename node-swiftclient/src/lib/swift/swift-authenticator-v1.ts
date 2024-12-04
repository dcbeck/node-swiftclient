import { AuthResult } from '../interfaces/auth-result';
import { Authenticator } from '../interfaces/authenticator';

// Constants for authentication status
enum AUTH_STATUS {
  UNAUTHENTICATED = 0,
  AUTHENTICATED = 1,
  FAILED = 2,
}

export class SwiftAuthenticatorV1 implements Authenticator {
  private url?: string;
  private token?: string;
  private authStatus: AUTH_STATUS = AUTH_STATUS.UNAUTHENTICATED;
  private authError: Error | null = null;

  constructor(authUrl: string, username: string, password: string) {
    // Start the authentication process
    this.authenticateWithServer(authUrl, username, password);
  }

  private async authenticateWithServer(
    authUrl: string,
    username: string,
    password: string
  ): Promise<void> {
    try {
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'x-auth-user': username,
          'x-auth-key': password,
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
      }

      const headers = response.headers;
      this.url = headers.get('x-storage-url') || '';
      this.token = headers.get('x-auth-token') || '';
      this.authStatus = AUTH_STATUS.AUTHENTICATED;
    } catch (err) {
      this.authStatus = AUTH_STATUS.FAILED;
      this.authError = err instanceof Error ? err : new Error(String(err));
    }
  }

  private _authenticate(): Promise<AuthResult> {
    switch (this.authStatus) {
      case AUTH_STATUS.UNAUTHENTICATED:
        return new Promise<AuthResult>((resolve, reject) => {
          if (
            this.authStatus === AUTH_STATUS.AUTHENTICATED &&
            this.url &&
            this.token
          ) {
            resolve({ url: this.url, token: this.token });
          } else if (this.authStatus === AUTH_STATUS.FAILED) {
            reject(this.authError);
          }
        });
      case AUTH_STATUS.AUTHENTICATED:
        return Promise.resolve({ url: this.url!, token: this.token! });
      case AUTH_STATUS.FAILED:
        return Promise.reject(this.authError);
      default:
        return Promise.reject(new Error('Unexpected authentication state'));
    }
  }

  public authenticate(): Promise<AuthResult> {
    return this._authenticate();
  }
}
