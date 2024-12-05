import { Readable } from 'stream';
import { SwiftEntity } from './swift-entity';
import { Authenticator } from '../interfaces/authenticator';
import { SwiftObject } from '../interfaces';

export class SwiftContainer extends SwiftEntity {
  constructor(containerName: string, authenticator: Authenticator) {
    super('Object', containerName, authenticator);
  }
  async listObjects(
    extra?: { [s: string]: string },
    query?: string | { [s: string]: string }
  ): Promise<SwiftObject[]> {
    return this.list(extra, query);
  }

  async getObjectMeta(objectName: string): Promise<Record<string, string>> {
    return this.getMeta(objectName);
  }

  async putObject(
    objectName: string,
    stream: Readable,
    meta: Record<string, string> | null,
    extra: Record<string, string> | null
  ): Promise<void> {
    const auth = await this.authenticator.authenticate();

    const headers = this.getHeaders(meta, extra, auth.token);
    const url = `${auth.url + this.urlSuffix}/${objectName}`;

    const duplex = {
      duplex: 'half',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any;
    // Using Fetch Streaming API
    const req = new Request(url, {
      method: 'PUT',
      headers: headers as HeadersInit,
      body: stream as unknown as BodyInit, // Node streams are not directly supported by `fetch`.
      ...duplex,
    });

    const response = await fetch(req);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async deleteObject(objectName: string, when?: Date | number): Promise<void> {
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
      const response = await fetch(
        `${auth.url + this.urlSuffix}/${objectName}`,
        {
          method: 'POST',
          headers: this.getHeaders(null, headers, auth.token),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } else {
      await super.delete(objectName);
    }
  }

  async getObject(
    objectName: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const auth = await this.authenticator.authenticate();
    const response = await fetch(`${auth.url + this.urlSuffix}/${objectName}`, {
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
