import { Readable } from 'stream';
import { SwiftEntity } from './swift-entity';
import { Authenticator } from '../interfaces/authenticator';

export class SwiftContainer extends SwiftEntity {
  constructor(containerName: string, authenticator: Authenticator) {
    super('Object', containerName, authenticator);
  }

  async create(
    name: string,
    stream: Readable,
    meta: Record<string, string> | null,
    extra: Record<string, string> | null
  ): Promise<void> {
    const auth = await this.authenticator.authenticate();

    const headers = this.headers(meta, extra, auth.token);
    const url = `${auth.url + this.urlSuffix}/${name}`;

    const duplex = {
        duplex: 'half'
    }
    // Using Fetch Streaming API
    const req = new Request(url, {
      method: 'PUT',
      headers: headers as HeadersInit,
      body: stream as unknown as BodyInit, // Node streams are not directly supported by `fetch`.
      ...duplex
    });

    const response = await fetch(req);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async delete(name: string, when?: Date | number): Promise<void> {
    if (when) {
      const headers: Record<string, string> = {};

      if (when instanceof Date) {
        headers['X-Delete-At'] = Math.floor(when.getTime() / 1000).toString();
      } else if (typeof when === 'number') {
        headers['X-Delete-After'] = when.toString();
      } else {
        throw new Error(
          'Expected `when` to be a number of seconds or a Date object'
        );
      }

      const auth = await this.authenticator.authenticate();
      const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
        method: 'POST',
        headers: this.headers(null, headers, auth.token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } else {
      await super.delete(name);
    }
  }

  async get(name: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${name}`, {
      method: 'GET',
      headers: {
        'x-auth-token': auth.token,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Streaming response to output stream
    if (response.body) {
      return response.body.getReader();
    } else {
      throw new Error('Response does not have a body');
    }
  }
}
