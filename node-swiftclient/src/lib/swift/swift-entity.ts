import { Authenticator } from '../interfaces/authenticator';
import { SwiftObject } from '../interfaces/swift-object';
import {
  getServerDateTimeOffset,
  parseDateWithServerTimezone,
} from '../utils/date-utils';
import { fetchWithTimeout } from '../utils/fetch-with-timeout';
import { tryAuthentication } from './swift-auth';

export class SwiftEntity {
  public readonly childName: string;
  public readonly urlSuffix: string;
  public readonly authenticator: Authenticator;

  constructor(
    childName: string,
    urlSuffix: string | null,
    authenticator: Authenticator
  ) {
    this.childName = childName;
    this.urlSuffix = urlSuffix ? `/${urlSuffix}` : '';
    this.authenticator = authenticator;
  }

  public async list(
    query?: { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): Promise<SwiftObject[]> {
    const listQuery = { format: 'json', ...(query ? query : {}) };

    const querystring = '?' + new URLSearchParams(listQuery).toString();
    const auth = await tryAuthentication(this.authenticator);
    const response = await fetchWithTimeout(auth.url + this.urlSuffix + querystring, {
      headers: this.getHeaders(null, extraHeaders, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error fetching list: ${response.statusText}`);
    const objects = (await response.json()) as any[];

    const serverTimezoneOffset = getServerDateTimeOffset(response);

    for (const object of objects) {
      if (typeof object.last_modified === 'string') {
        object.last_modified = parseDateWithServerTimezone(
          object.last_modified,
          serverTimezoneOffset
        );
      }
    }
    return objects as SwiftObject[];
  }

  public async update(
    name: string,
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null
  ): Promise<void> {
    const auth = await tryAuthentication(this.authenticator);
    const response = await fetchWithTimeout(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'POST',
      headers: this.getHeaders(meta, extraHeaders, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error updating ${name}: ${response.statusText}`);
    return;
  }

  public async getMeta(name: string): Promise<Record<string, string>> {
    const auth = await tryAuthentication(this.authenticator);
    const response = await fetchWithTimeout(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'HEAD',
      headers: this.getHeaders(null, null, auth.token),
    });
    if (!response.ok)
      throw new Error(
        `Error fetching metadata for ${name}: ${response.statusText}`
      );

    const meta: Record<string, string> = {};
    const headers = response.headers;
    const regex = new RegExp(`^X-${this.childName}-Meta-(.*)$`, 'i');

    headers.forEach((value, key) => {
      const match = key.match(regex);
      if (match) meta[match[1]] = value;
    });
    return meta;
  }

  public async delete(name: string): Promise<void> {
    const auth = await tryAuthentication(this.authenticator);
    const response = await fetchWithTimeout(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'DELETE',
      headers: this.getHeaders(null, null, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error deleting ${name}: ${response.statusText}`);
  }

  public getHeaders(
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null,
    token: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'x-auth-token': token,
      accept: 'application/json',
      ...extraHeaders,
    };

    if (meta != null) {
      for (const k in meta) {
        if (Object.prototype.hasOwnProperty.call(meta, k)) {
          headers[`X-${this.childName}-Meta-${k}`] = meta[k];
        }
      }
    }

    return headers;
  }


}
