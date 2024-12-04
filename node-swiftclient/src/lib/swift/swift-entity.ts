import { Authenticator } from "../interfaces/authenticator";
import { SwiftObject } from "../interfaces/swift-object";


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

  async list(
    extra?: { [s: string]: string },
    query?: string | { [s: string]: string }
  ): Promise<SwiftObject[]> {
    const querystring = query
      ? '?' + new URLSearchParams(query).toString()
      : '';
    const auth = await this.authenticator.authenticate();
    console.log(auth);
    console.log('sheeeeh', auth.url + this.urlSuffix + querystring);
    const response = await fetch(auth.url + this.urlSuffix + querystring, {
      headers: this.headers(null, extra, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error fetching list: ${response.statusText}`);
    return response.json();
  }

  async update(
    name: string,
    meta: Record<string, string> | null,
    extra: Record<string, string> | null
  ): Promise<any> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'POST',
      headers: this.headers(meta, extra, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error updating ${name}: ${response.statusText}`);
    return response.json();
  }

  async meta(name: string): Promise<Record<string, string>> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'HEAD',
      headers: this.headers(null, null, auth.token),
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

  async delete(name: string): Promise<void> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'DELETE',
      headers: this.headers(null, null, auth.token),
    });
    if (!response.ok)
      throw new Error(`Error deleting ${name}: ${response.statusText}`);
  }

  protected headers(
    meta: Record<string, string> | null,
    extra: Record<string, string> | null,
    token: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-auth-token': token,
      ...extra,
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
