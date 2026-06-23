declare module "streamifier" {
  import { Readable } from "stream";

  export function createReadStream(buffer: Buffer): Readable;

  const streamifier: {
    createReadStream: typeof createReadStream;
  };

  export default streamifier;
}
