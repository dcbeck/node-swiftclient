import { Authenticator } from '../interfaces';

const AUTH_STATUS = {
  UNAUTHENTICATED: 0,
  AUTHENTICATED: 1,
  FAILED: 2,
};

export class SwiftAuthenticatorV1 implements Authenticator {
  // Authenticated credentials
  private url;
  private token;

  // Authentication process flags
  private authStatus = AUTH_STATUS.UNAUTHENTICATED;
  private authError = null;

  constructor(
    private readonly authUrl: string,
    private readonly username: string,
    private readonly password: string,
    private readonly tenant: string | null
  ) {}

  private async runAuth() {
    try {
      const res = await fetch(this.authUrl, {
        headers: {
          'x-auth-user':
            this.tenant === null
              ? this.username
              : this.tenant + ':' + this.username,
          'x-auth-key': this.password,
        },
      });
      this.url = res.headers
        .get('x-storage-url')
        .replace(new RegExp('//', 'g'), '/');
      this.token = res.headers.get('x-auth-token');
      this.authStatus = AUTH_STATUS.AUTHENTICATED;
    } catch (error) {
      this.authStatus = AUTH_STATUS.FAILED;
      this.authError = error;
      this.url = '';
      this.token = '';
    }
  }

  private async _authenticate(): Promise<{ url: string; token: string }> {
    switch (this.authStatus) {
      case AUTH_STATUS.UNAUTHENTICATED:
        await this.runAuth();
        return this._authenticate();
      case AUTH_STATUS.AUTHENTICATED:
        return { url: this.url, token: this.token };
      case AUTH_STATUS.FAILED:
        await this.runAuth();
        if (AUTH_STATUS.AUTHENTICATED) {
          return { url: this.url, token: this.token };
        }
    }
    return Promise.reject(this.authError);
  }

  async authenticate() {
    return this._authenticate();
  }
}
