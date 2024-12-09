export type SwiftContainerData = {
  /** The number of objects in the container. */
  count: number;
  /** The total size of all objects in the container, in bytes. */
  bytes: number;
  /** The last modified date of the container. */
  last_modified: string;
  /** The name of the container. */
  name: string;
};
