import { Authenticator, AuthResult } from '../interfaces';
import { wait } from '../utils/utils';

export async function tryAuthentication(
  authenticator: Authenticator
): Promise<AuthResult> {
  let success = false;
  let retries = 0;
  let lastError: any = '';
  while (!success && retries < 3) {
    try {
      const auth = await authenticator.authenticate();
      return auth;
    } catch (error) {
      success = false;
      lastError = error;
    }
    await wait(500);
    retries++;
  }
  Promise.reject(lastError);
}
