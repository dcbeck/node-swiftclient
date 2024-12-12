import { Readable } from 'stream';
import { SwiftObject } from './swift-object';
import { SwiftObjectData } from './swift-object-data';
import { SwiftSubDir } from './swift-sub-dir';

/**
 * Represents a container in the Swift storage service.
 * Provides methods for listing, managing, and interacting with objects and directories within the container.
 */
export interface SwiftContainer {
  /**
   * Retrieves a list of objects in the container with optional filtering and pagination.
   *
   * @param options - Configuration for filtering and pagination:
   *   - `prefix`: Filters objects by their prefix.
   *   - `delimiter`: Groups objects by the specified delimiter.
   *   - `limit`: Limits the number of returned objects.
   *   - `reverse`: Reverses the order of the results.
   *   - `marker`: Specifies the marker to start listing from.
   *   - `end_marker`: Specifies the marker to end the listing at.
   * @param additionalQueryParams - Additional query parameters for the API request.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns A promise resolving to an array of `SwiftObject` instances.
   */
  listObjects(
    options?: {
      prefix?: string;
      delimiter?: string;
      limit?: number;
      reverse?: boolean;
      marker?: string;
      end_marker?: string;
    },
    additionalQueryParams?: { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): Promise<SwiftObject[]>;

  /**
   * Retrieves a list of object "folders" (subdirectories) in the container with optional filtering and pagination.
   *
   * @param options - Configuration for filtering and pagination:
   *   - `delimiter`: Groups objects by the specified delimiter.
   *   - `limit`: Limits the number of returned directories.
   *   - `reverse`: Reverses the order of the results.
   *   - `marker`: Specifies the marker to start listing from.
   *   - `end_marker`: Specifies the marker to end the listing at.
   * @param additionalQueryParams - Additional query parameters for the API request.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns A promise resolving to an array of `SwiftSubDir` instances.
   */
  listObjectFolders(
    options?: {
      delimiter?: string;
      limit?: number;
      reverse?: boolean;
      marker?: string;
      end_marker?: string;
    },
    additionalQueryParams?: Record<string, string>,
    extraHeaders?: Record<string, string>
  ): Promise<SwiftSubDir[]>;

  /**
   * Iterates over all objects in the container, one at a time, in batches defined by the specified options.
   *
   * This method fetches objects in chunks, making it possible to process large datasets without high memory usage.
   *
   * @param options - Configuration for iteration:
   *   - `prefix`: Filters objects by their prefix.
   *   - `delimiter`: Groups objects by the specified delimiter.
   *   - `batchSize`: The number of objects to fetch per batch (default: 10000).
   * @param additionalQueryParams - Additional query parameters for the API request.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns An async generator yielding individual `SwiftObject` instances.
   *
   * @example
   * const options = { batchSize: 1000 };
   *
   * for await (const swiftObject of container.iterateObjects(options)) {
   *   console.log(`Processing object: ${swiftObject.name}`);
   * }
   */
  iterateObjects(
    options?: {
      prefix?: string;
      delimiter?: string;
      batchSize: number;
    },
    additionalQueryParams?: { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): AsyncGenerator<SwiftObject>;

  /**
   * Iterates over all object "folders" (subdirectories) in the container, one at a time, in batches defined by the specified options.
   *
   * @param options - Configuration for iteration:
   *   - `delimiter`: Groups objects by the specified delimiter.
   *   - `batchSize`: The number of directories to fetch per batch (default: 10000).
   * @param additionalQueryParams - Additional query parameters for the API request.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns An async generator yielding individual `SwiftSubDir` instances.
   */
  iterateObjectFolders(
    options?: {
      delimiter?: string;
      batchSize: number;
    },
    additionalQueryParams?: { [s: string]: string },
    extraHeaders?: { [s: string]: string }
  ): AsyncGenerator<SwiftSubDir>;

  /**
   * Retrieves metadata for a specific object in the container.
   *
   * @param objectName - The name of the object.
   * @returns A promise resolving to the object's metadata as a key-value object.
   */
  getObjectMeta(objectName: string): Promise<Record<string, string>>;

  /**
   * Updates metadata for a specific object in the container.
   *
   * @param name - The name of the object.
   * @param meta - The metadata to update for the object.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns A promise that resolves when the metadata update is complete.
   */
  patchObjectMeta(
    name: string,
    meta: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;

  /**
   * Uploads a readable stream as an object to the container.
   *
   * @param objectName - The name of the object.
   * @param stream - The readable stream containing the object data.
   * @param meta - Optional metadata to associate with the object.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns A promise that resolves when the upload is complete.
   */
  putObject(
    objectName: string,
    stream: Readable,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;
  /**
   * Uploads a buffer as an object to the container.
   *
   * @param objectName - The name of the object.
   * @param buffer - The buffer containing the object data.
   * @param meta - Optional metadata to associate with the object.
   * @param extraHeaders - Additional headers to include in the request.
   * @returns A promise that resolves when the upload is complete.
   */
  putObject(
    objectName: string,
    buffer: Buffer,
    meta?: Record<string, string> | null,
    extraHeaders?: Record<string, string> | null
  ): Promise<void>;

  /**
   * Deletes a specific object from the container.
   *
   * @param objectName - The name of the object.
   * @param when - Optional timestamp or date to schedule the deletion.
   * @returns A promise that resolves when the object is successfully deleted.
   */
  deleteObject(objectName: string, when?: Date | number): Promise<void>;

  /**
   * Downloads a specific object from the container as a readable stream.
   *
   * @param objectName - The name of the object.
   * @returns A promise resolving to a readable stream of the object data.
   */
  getObject(
    objectName: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>>;

  /**
   * Downloads a specific object from the container as a buffer.
   *
   * @param objectName - The name of the object.
   * @returns A promise resolving to a buffer containing the object data.
   */
  getObjectAsBuffer(objectName: string): Promise<Buffer>;

  /**
   * Retrieves information about an object without downloading its content.
   *
   * @param objectName - The name of the object.
   * @returns A promise resolving to the object's information as a `SwiftObjectData` instance.
   */
  getObjectInfo(objectName: string): Promise<SwiftObjectData>;
}
