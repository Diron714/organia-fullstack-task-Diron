import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadAvatar } from "@/api/users.api";
import { parseApiError } from "@/utils/errorUtils";
import { resolveAvatarUrl } from "@/utils/mediaUrl";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "U";
}

export default function AvatarUpload({
  currentAvatarUrl,
  userName,
  onUploadSuccess
}: {
  currentAvatarUrl?: string;
  userName: string;
  onUploadSuccess: (newUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = previewUrl ?? currentAvatarUrl;
  const imgSrc =
    resolveAvatarUrl(previewUrl ?? currentAvatarUrl) ?? previewUrl ?? currentAvatarUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      const url = res.data.avatarUrl;
      setPreviewUrl(null);
      onUploadSuccess(url);
      toast.success("Profile photo updated");
    } catch (err) {
      setPreviewUrl(null);
      toast.error(parseApiError(err).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          type="button"
          className="group relative cursor-pointer"
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
        >
          {displayUrl ? (
            <img src={imgSrc} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              {initialsFromName(userName)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-8 w-8 text-white" />
          </div>
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : null}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(ev) => void handleFileChange(ev)}
        />
      </div>
      <p className="text-xs text-gray-400">Click to change photo</p>
    </div>
  );
}
