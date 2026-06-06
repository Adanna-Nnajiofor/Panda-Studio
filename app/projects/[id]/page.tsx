"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson, apiUpload } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";
import { PROJECT_STATUS_LABELS } from "../../../lib/studio";

type ProjectFile = {
  _id: string;
  label?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isWatermarked: boolean;
  downloadCount: number;
};

type Project = {
  _id: string;
  progressStatus: string;
  expiryDate: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = String(params.id ?? "");

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadType, setUploadType] = useState<
    "image" | "video" | "audio" | "document"
  >("image");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const [proj, fileRes] = await Promise.all([
        apiJson<{ project: Project }>(`/projects/${projectId}`),
        apiJson<{ files: ProjectFile[] }>(`/projects/${projectId}/files`).catch(
          () => ({ files: [] }),
        ),
      ]);
      setProject(proj.project);
      setFiles(fileRes.files ?? []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load project."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDownload = async (file: ProjectFile) => {
    try {
      const res = await apiJson<{ fileUrl: string }>(
        `/projects/${projectId}/files/${file._id}/download`,
        { method: "POST" },
      );
      window.open(res.fileUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.open(file.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleUploadMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    try {
      await apiJson(`/projects/${projectId}/files`, {
        method: "POST",
        body: JSON.stringify({
          fileUrl: uploadUrl,
          fileType: uploadType,
          fileSize: 1024,
          label: uploadLabel || "Client reference",
          isClientReference: "true",
        }),
      });
      setUploadUrl("");
      setUploadLabel("");
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Upload failed."));
    }
  };

  return (
    <RoleGate
      allowedRoles={["client", "admin", "super_admin", "crew", "staff"]}
    >
      <DashboardShell
        kicker="Project deliverables"
        title={
          project ? `Project ${project._id.slice(-8).toUpperCase()}` : "Project"
        }
        summary="Download finished photos, videos, and documents. Upload reference files for the team."
      >
        {loading ? <p>Loading...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {project ? (
          <p className="text-sm">
            Status:{" "}
            {PROJECT_STATUS_LABELS[project.progressStatus] ??
              project.progressStatus}
          </p>
        ) : null}

        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-black uppercase">Downloads</h2>
          {files.length === 0 ? (
            <p className="text-sm text-gray-600">
              No files uploaded yet. Check back after delivery.
            </p>
          ) : (
            files.map((file) => (
              <article
                key={file._id}
                className="flex flex-wrap items-center justify-between gap-3 border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000]"
              >
                <div>
                  <p className="font-black">{file.label || file.fileType}</p>
                  <p className="text-xs text-gray-600">
                    {file.fileType}
                    {file.isWatermarked ? " · Preview" : ""} ·{" "}
                    {file.downloadCount} downloads
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDownload(file)}
                  className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
                >
                  Download
                </button>
              </article>
            ))
          )}
        </section>

        <section className="mt-8 border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-xl font-black uppercase">Upload file</h2>
          <p className="mt-1 text-sm">
            Upload photos, videos, or documents (requires Cloudinary on server).
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!fileToUpload) return;
              setUploading(true);
              try {
                const fd = new FormData();
                fd.append("file", fileToUpload);
                if (uploadLabel) fd.append("label", uploadLabel);
                fd.append("isClientReference", "true");
                await apiUpload(`/projects/${projectId}/files/upload`, fd);
                setFileToUpload(null);
                await load();
              } catch (err: unknown) {
                setError(getErrorMessage(err, "File upload failed."));
              } finally {
                setUploading(false);
              }
            }}
            className="mt-4 space-y-3"
          >
            <input
              type="file"
              onChange={(e) => setFileToUpload(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            <button
              type="submit"
              disabled={!fileToUpload || uploading}
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload file"}
            </button>
          </form>
        </section>

        <section className="mt-8 border-4 border-black bg-[#fef1cf] p-5 shadow-[8px_8px_0_0_#000]">
          <h2 className="text-xl font-black uppercase">Or paste a link</h2>
          <p className="mt-1 text-sm">
            Cloud link for moodboards or brand assets.
          </p>
          <form onSubmit={handleUploadMetadata} className="mt-4 space-y-3">
            <input
              type="url"
              required
              placeholder="https://..."
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Label"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-sm"
            />
            <select
              value={uploadType}
              onChange={(e) =>
                setUploadType(e.target.value as typeof uploadType)
              }
              className="border-2 border-black px-3 py-2 text-sm"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
            <button
              type="submit"
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f2eadf]"
            >
              Save reference
            </button>
          </form>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
