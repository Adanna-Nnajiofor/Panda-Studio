import { Readable } from "stream";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format: string;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  publicId?: string;
  overwrite?: boolean;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  mimetype: string,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(
      new Error(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "panda-studio",
        resource_type: options.resourceType ?? "auto",
        public_id: options.publicId,
        overwrite: options.overwrite ?? false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId);
};
