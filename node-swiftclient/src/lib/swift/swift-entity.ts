import { Authenticator } from '../interfaces/authenticator';
import { SwiftObject } from '../interfaces/swift-object';

export class SwiftEntity {
  protected readonly childName: string;
  protected readonly urlSuffix: string;
  protected readonly authenticator: Authenticator;

  constructor(
    childName: string,
    urlSuffix: string | null,
    authenticator: Authenticator
  ) {
    this.childName = childName;
    this.urlSuffix = urlSuffix ? `/${urlSuffix}` : '';
    this.authenticator = authenticator;
  }

  protected async list(
    query?: string | { [s: string]: string },
    extraHeaders?: { [s: string]: string },
  ): Promise<SwiftObject[]> {
    const querystring = query
      ? '?' + new URLSearchParams(query).toString()
      : '';
    const auth = await this.authenticator.authenticate();
    const response = await fetch(auth.url + this.urlSuffix + querystring, {
      headers: this.getHeaders(null, extraHeaders, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error fetching list: ${response.statusText}`);
    return response.json();
  }

  protected async update(
    name: string,
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null
  ): Promise<void> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'POST',
      headers: this.getHeaders(meta, extraHeaders, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error updating ${name}: ${response.statusText}`);
    return
  }

  protected async getMeta(name: string): Promise<Record<string, string>> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
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

  protected async delete(name: string): Promise<void> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'DELETE',
      headers: this.getHeaders(null, null, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error deleting ${name}: ${response.statusText}`);
  }

  protected getHeaders(
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null,
    token: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-auth-token': token,
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
