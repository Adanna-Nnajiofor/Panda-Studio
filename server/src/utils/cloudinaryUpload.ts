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
  mimetype?: string,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  if (!buffer) {
    return Promise.reject(new Error("Upload failed: buffer is empty"));
  }

  if (!isCloudinaryConfigured()) {
    return Promise.reject(
      new Error(
        "Cloudinary is not configured. Check CLOUDINARY env variables.",
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
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary returned empty result"));
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

    const stream = Readable.from(buffer);

    stream.on("error", (err) => {
      console.error("Readable stream error:", err);
      reject(err);
    });

    stream.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!publicId) return;

  if (!isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};
