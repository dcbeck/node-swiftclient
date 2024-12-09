import { Readable } from 'stream';
import { SwiftObject } from './swift-object';

/**
 * Represents a container in the Swift storage service.
 * Provides methods for managing objects within the container.
 */
export interface SwiftContainer {
  /**
   * Lists objects in the container with optional filtering and pagination.
   * @param options - Options for limiting and filtering the object list.
   * @param additionalQueryParams - Additional query parameters to include in the request.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @returns A promise resolving with an array of SwiftObject instances.
   */
  listObjects(
    options?:
      | {
          limit?: number;
          prefix?: string;
          delimiter?: string;
        }
      | {
          limit?: number;
          reverse?: boolean;
          marker?: string;
          end_marker?: string;
        },
    additionalQueryParams?: {
      [s: string]: string;
    },
    extraHeaders?: {
      [s: string]: string;
    }
  ): Promise<SwiftObject[]>;

  /**
   * Retrieves metadata for a specific object in the container.
   * @param objectName - The name of the object.
   * @returns A promise resolving with the object's metadata as a key-value object.
   */
  getObjectMeta(objectName: string): Promise<Record<string, string>>;

  /**
   * Updates metadata for a specific object in the container.
   * @param name - The name of the object.
   * @param meta - The metadata to apply to the object.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @returns A promise that resolves when the metadata is successfully updated.
   */
  patchObjectMeta(
    name: string,
    meta: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;

  /**
   * Uploads a stream to the specified object in the container.
   * @param objectName - The name of the object.
   * @param stream - The readable stream to upload.
   * @param meta - Optional metadata to associate with the object.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @returns A promise that resolves when the object is successfully uploaded.
   */
  putObject(
    objectName: string,
    stream: Readable,
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null,
  ): Promise<void>;
  /**
   * Uploads a buffer to the specified object in the container.
   * @param objectName - The name of the object.
   * @param buffer - The buffer containing object data.
   * @param meta - Optional metadata to associate with the object.
   * @param extraHeaders - Optional extra headers to include in the request.
   * @param encoding - Optional buffer encoding.
   * @returns A promise that resolves when the object is successfully uploaded.
   */
  putObject(
    objectName: string,
    buffer: Buffer,
    meta: Record<string, string> | null,
    extraHeaders: Record<string, string> | null,
  ): Promise<void>;

  /**
   * Deletes a specific object from the container.
   * @param objectName - The name of the object.
   * @param when - Optional timestamp or date to schedule deletion.
   * @returns A promise that resolves when the object is successfully deleted.
   */
  deleteObject(objectName: string, when?: Date | number): Promise<void>;

  /**
   * Downloads a specific object from the container as a stream.
   * @param objectName - The name of the object.
   * @returns A promise resolving with a readable stream of the object data.
   */
  getObject(
    objectName: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>>;

  /**
   * Downloads a specific object from the container as a buffer.
   * @param objectName - The name of the object.
   * @returns A promise resolving with a buffer containing the object data.
   */
  getObjectAsBuffer(objectName: string): Promise<Buffer>;
}
