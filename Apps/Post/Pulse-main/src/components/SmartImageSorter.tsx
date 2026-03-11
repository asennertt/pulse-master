import { useState, useRef } from "react";
import { Camera, X, Info, Loader2, Trash2, Plus, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Vehicle } from "@/data/vehicles";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || "dbfhx3and";
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "PulsePost";

interface SmartImageSorterProps {
  vehicle: Vehicle;
  onClose: () => void;
  onImagesUpdated?: (vehicleId: string, newImages: string[]) => void;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "pulse-vehicles");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url;
}

export function SmartImageSorter({ vehicle, onClose, onImagesUpdated }: SmartImageSorterProps) {
  const [images, setImages] = useState<string[]>(vehicle.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImageUrls: string[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${total}...`);

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
          toast.error(`${file.name} is not a supported format (JPEG, PNG, or WebP)`);
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        try {
          const url = await uploadToCloudinary(file);
          newImageUrls.push(url);
        } catch (err: any) {
          toast.error(`Failed to upload ${file.name}`, { description: err.message });
        }
      }

      if (newImageUrls.length > 0) {
        // Merge with existing images and update the DB
        const updatedImages = [...images, ...newImageUrls];

        const { error: updateError } = await supabase
          .from("vehicles")
          .update({ images: updatedImages, updated_at: new Date().toISOString() })
          .eq("id", vehicle.id);

        if (updateError) {
          toast.error("Failed to save images to vehicle", { description: updateError.message });
        } else {
          setImages(updatedImages);
          onImagesUpdated?.(vehicle.id, updatedImages);
          toast.success(`${newImageUrls.length} photo${newImageUrls.length > 1 ? "s" : ""} added`);
        }
      }
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (idx: number) => {
    setDeleting(idx);

    try {
      // Remove from array and update DB
      const updatedImages = images.filter((_, i) => i !== idx);
      const { error } = await supabase
        .from("vehicles")
        .update({ images: updatedImages, updated_at: new Date().toISOString() })
        .eq("id", vehicle.id);

      if (error) {
        toast.error("Failed to remove image", { description: error.message });
      } else {
        setImages(updatedImages);
        onImagesUpdated?.(vehicle.id, updatedImages);
        toast.success("Photo removed");
      }
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  // Check if an image is a manually uploaded one (Cloudinary URL)
  const isManualUpload = (url: string) => url.includes("cloudinary.com");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-2xl mx-4 p-6 animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Vehicle Photos</h2>
            <span className="text-xs text-muted-foreground font-mono">
              ({images.length} photo{images.length !== 1 ? "s" : ""})
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Photos from your DMS import appear here automatically. You can also{" "}
            <span className="font-medium text-foreground">add your own photos</span> — they'll be
            combined with the DMS images.
          </p>
        </div>

        {/* Upload button */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 px-4 py-3 w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5 text-primary" />
            )}
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">
                {uploading ? uploadProgress || "Uploading..." : "Add Photos"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                JPEG, PNG, or WebP · Max 10MB each · Select multiple
              </div>
            </div>
          </button>
        </div>

        {/* Image grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`relative rounded-lg border overflow-hidden group/img ${
                  idx === 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <img
                  src={src}
                  alt={`Photo ${idx + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                />
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    HERO
                  </div>
                )}
                {isManualUpload(src) && (
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-secondary/90 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground border border-border">
                    Manual
                  </div>
                )}
                {/* Delete button — show on hover */}
                <button
                  onClick={() => handleDeleteImage(idx)}
                  disabled={deleting === idx}
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-destructive/90 p-1.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-50"
                  title="Remove photo"
                >
                  {deleting === idx ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}

            {/* Add more tile */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center justify-center aspect-[4/3] rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
            >
              <Plus className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">Add More</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Camera className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No photos yet</p>
            <p className="text-xs mt-1">Upload photos or import them from your DMS</p>
          </div>
        )}
      </div>
    </div>
  );
}
