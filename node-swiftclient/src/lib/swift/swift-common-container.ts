import { Readable } from 'stream';
import { SwiftEntity } from './swift-entity';
import { Authenticator } from '../interfaces/authenticator';
import { SwiftObject, SwiftContainer } from '../interfaces';

export class SwiftCommonContainer
  extends SwiftEntity
  implements SwiftContainer
{
  constructor(containerName: string, authenticator: Authenticator) {
    super('Object', containerName, authenticator);
  }

  async listObjects(
    options?:
      | {
          limit?: number;
          prefix?: string; // https://docs.openstack.org/swift/latest/api/pseudo-hierarchical-folders-directories.html
          delimiter?: string; //default is a slash '/'
        }
      | {
          limit?: number;
          reverse?: boolean;
          marker?: string; //For a string value, x , constrains the list to items whose names are greater than x.
          end_marker?: string; //For a string value, x , constrains the list to items whose names are less than x.
        },
    additionalQueryParams?: { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): Promise<SwiftObject[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let queryParams: any = {};
    if (additionalQueryParams) {
      queryParams = { ...additionalQueryParams };
    }
    if (options) {
      if (this.hasPrefix(options)) {
        if (options.prefix) {
          queryParams.prefix = this.ensureTrailingSlash(options.prefix);
        }
        if (options.delimiter) {
          queryParams.delimiter = options.delimiter;
        } else {
          queryParams.delimiter = '/';
        }
      } else {
        if (options.marker) {
          queryParams.maker = options.marker;
        }
        if (options.marker) {
          queryParams.maker = options.marker;
        }
        if (options.end_marker) {
          queryParams.end_marker = options.end_marker;
        }
        if (typeof options.reverse === 'boolean') {
          queryParams.reverse = options.reverse;
        }
      }

      if (typeof options.limit === 'number') {
        queryParams.limit = Math.round(options.limit);
      }
    }

    return this.list(queryParams, extraHeaders);
  }

  async getObjectMeta(objectName: string): Promise<Record<string, string>> {
    return this.getMeta(objectName);
  }

  async patchObjectMeta(
    name: string,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void> {
    await this.update(name, meta ?? null, extraHeaders ?? null);
  }

  async putObject(
    objectName: string,
    stream: Readable,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;
  async putObject(
    objectName: string,
    buffer: Buffer,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;
  async putObject(
    objectName: string,
    streamOrBuffer: Readable | Buffer,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void> {
    let stream: Readable | undefined;
    if (Buffer.isBuffer(streamOrBuffer)) {
      stream = this.bufferToStream(streamOrBuffer);
    } else {
      stream = streamOrBuffer;
    }

    const auth = await this.authenticator.authenticate();

    const headers = this.getHeaders(meta ?? null, extraHeaders ?? null, auth.token);
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

  async getObjectAsBuffer(objectName: string): Promise<Buffer> {
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
      const arrayBuffer = await response.arrayBuffer();
      // Convert the ArrayBuffer to a Buffer
      const buffer = Buffer.from(arrayBuffer);
      return buffer;
    } else {
      throw new Error('Response does not have a body');
    }
  }

  private bufferToStream(buffer: Buffer) {
    return new Readable({
      read() {
        this.push(buffer); // Push the buffer into the stream
        this.push(null); // Signal the end of the stream
      },
    });
  }

  private ensureTrailingSlash(inputStr: string) {
    const str = inputStr.trim();
    if (str.charAt(str.length - 1) !== '/') {
      return str + '/';
    }
    return str;
  }

  private hasPrefix(options: unknown): options is {
    prefix?: string;
    limit?: number;
  } {
    const opt = options as any;
    return typeof opt.prefix === 'string' && opt.prefix.trim().length > 0;
  }
}
