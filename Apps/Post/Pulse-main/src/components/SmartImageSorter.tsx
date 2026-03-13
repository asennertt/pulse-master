import { useState, useRef } from "react";
import { Camera, X, Info, Loader2, Trash2, Plus, ImagePlus, Sparkles, Star, ArrowUpDown, Zap, AlertTriangle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Vehicle } from "@/data/vehicles";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || "dbfhx3and";
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "PulsePost";

interface ImageScore {
  url: string;
  quality_score: number;
  flags: string[];
  hero_candidate: boolean;
  reason: string;
}

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

const FLAG_LABELS: Record<string, string> = {
  bordered: "Bordered",
  watermarked: "Watermark",
  stock_photo: "Stock",
  blurry: "Blurry",
  interior: "Interior",
  exterior: "Exterior",
  engine: "Engine",
  damage: "Damage",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "bg-success/20 text-success border-success/30"
      : score >= 4
        ? "bg-warning/20 text-warning border-warning/30"
        : "bg-destructive/20 text-destructive border-destructive/30";
  return (
    <div className={`absolute top-1.5 right-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
      {score}/10
    </div>
  );
}

export function SmartImageSorter({ vehicle, onClose, onImagesUpdated }: SmartImageSorterProps) {
  const [images, setImages] = useState<string[]>(vehicle.images || []);
  const [scores, setScores] = useState<ImageScore[]>((vehicle.image_scores as ImageScore[]) || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getScoreForUrl = (url: string): ImageScore | undefined =>
    scores.find((s) => s.url === url);

  const hasScores = scores.length > 0;

  // ── Upload ──────────────────────────────────────────────────
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

        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
          toast.error(`${file.name} is not a supported format (JPEG, PNG, or WebP)`);
          continue;
        }

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

  // ── Delete single image ─────────────────────────────────────
  const handleDeleteImage = async (idx: number) => {
    setDeleting(idx);
    try {
      const removedUrl = images[idx];
      const updatedImages = images.filter((_, i) => i !== idx);
      const updatedScores = scores.filter((s) => s.url !== removedUrl);

      const { error } = await supabase
        .from("vehicles")
        .update({ images: updatedImages, image_scores: updatedScores.length > 0 ? updatedScores : null, updated_at: new Date().toISOString() })
        .eq("id", vehicle.id);

      if (error) {
        toast.error("Failed to remove image", { description: error.message });
      } else {
        setImages(updatedImages);
        setScores(updatedScores);
        onImagesUpdated?.(vehicle.id, updatedImages);
        toast.success("Photo removed");
      }
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  // ── AI Analyze ──────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("No images to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-images", {
        body: { vehicle_id: vehicle.id },
      });

      if (error) {
        toast.error("AI analysis failed", { description: error.message });
        return;
      }

      if (data?.image_scores) {
        setScores(data.image_scores);
        toast.success("AI analysis complete", {
          description: `${data.image_scores.length} image${data.image_scores.length !== 1 ? "s" : ""} scored`,
        });
      } else if (data?.error) {
        toast.error("Analysis error", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Analysis failed", { description: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Sort by Quality ─────────────────────────────────────────
  const handleSortByQuality = async () => {
    if (!hasScores) {
      toast.error("Run AI Analyze first to get quality scores");
      return;
    }

    const scoreMap = new Map(scores.map((s) => [s.url, s]));

    const sorted = [...images].sort((a, b) => {
      const sa = scoreMap.get(a);
      const sb = scoreMap.get(b);
      // Hero candidates first
      const heroA = sa?.hero_candidate ? 1 : 0;
      const heroB = sb?.hero_candidate ? 1 : 0;
      if (heroB !== heroA) return heroB - heroA;
      // Then by quality score descending
      return (sb?.quality_score || 0) - (sa?.quality_score || 0);
    });

    const { error } = await supabase
      .from("vehicles")
      .update({ images: sorted, updated_at: new Date().toISOString() })
      .eq("id", vehicle.id);

    if (error) {
      toast.error("Failed to save new order", { description: error.message });
    } else {
      setImages(sorted);
      onImagesUpdated?.(vehicle.id, sorted);
      toast.success("Images sorted by quality", { description: "Hero candidates moved to front" });
    }
  };

  // ── Remove Bad Images ───────────────────────────────────────
  const handleRemoveBadImages = async () => {
    if (!hasScores) {
      toast.error("Run AI Analyze first");
      return;
    }

    const scoreMap = new Map(scores.map((s) => [s.url, s]));
    const badUrls = new Set(
      scores.filter((s) => s.quality_score <= 3).map((s) => s.url)
    );

    if (badUrls.size === 0) {
      toast.info("No low-quality images found (score 3 or below)");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${badUrls.size} low-quality image${badUrls.size !== 1 ? "s" : ""} (scored 3 or below)?`
    );
    if (!confirmed) return;

    const updatedImages = images.filter((url) => !badUrls.has(url));
    const updatedScores = scores.filter((s) => !badUrls.has(s.url));

    const { error } = await supabase
      .from("vehicles")
      .update({
        images: updatedImages,
        image_scores: updatedScores.length > 0 ? updatedScores : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicle.id);

    if (error) {
      toast.error("Failed to remove images", { description: error.message });
    } else {
      setImages(updatedImages);
      setScores(updatedScores);
      onImagesUpdated?.(vehicle.id, updatedImages);
      toast.success(`${badUrls.size} low-quality image${badUrls.size !== 1 ? "s" : ""} removed`);
    }
  };

  const isManualUpload = (url: string) => url.includes("cloudinary.com");

  const badCount = scores.filter((s) => s.quality_score <= 3).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-xl w-full max-w-3xl mx-4 p-6 animate-slide-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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
            combined with the DMS images. Use <span className="font-medium text-foreground">AI Analyze</span> to score photo quality.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Upload button */}
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
            className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {uploading ? uploadProgress || "Uploading..." : "Add Photos"}
          </button>

          {/* AI Analyze */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || images.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? "Analyzing..." : "AI Analyze"}
          </button>

          {/* Sort by Quality */}
          {hasScores && (
            <button
              onClick={handleSortByQuality}
              className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Quality
            </button>
          )}

          {/* Remove Bad Images */}
          {hasScores && badCount > 0 && (
            <button
              onClick={handleRemoveBadImages}
              className="flex items-center gap-1.5 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Remove Low Quality ({badCount})
            </button>
          )}
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {images.map((src, idx) => {
                const score = getScoreForUrl(src);
                return (
                  <div
                    key={`${src}-${idx}`}
                    className={`relative rounded-lg border overflow-hidden group/img ${
                      idx === 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Photo ${idx + 1}`}
                      className="w-full aspect-[4/3] object-cover"
                    />

                    {/* Analyzing overlay */}
                    {analyzing && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      </div>
                    )}

                    {/* Hero badge (position 0) */}
                    {idx === 0 && (
                      <div className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        HERO
                      </div>
                    )}

                    {/* AI Hero candidate star */}
                    {score?.hero_candidate && idx !== 0 && (
                      <div className="absolute top-1.5 left-1.5 rounded-full bg-warning/20 border border-warning/40 px-1.5 py-0.5 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 text-warning fill-warning" />
                        <span className="text-[9px] font-bold text-warning">HERO</span>
                      </div>
                    )}

                    {/* Quality score badge */}
                    {score && !analyzing && <ScoreBadge score={score.quality_score} />}

                    {/* Manual upload badge */}
                    {isManualUpload(src) && !score && (
                      <div className="absolute top-1.5 right-1.5 rounded-full bg-secondary/90 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground border border-border">
                        Manual
                      </div>
                    )}

                    {/* Flag pills */}
                    {score && !analyzing && score.flags.length > 0 && (
                      <div className="absolute bottom-8 left-1 right-1 flex flex-wrap gap-0.5 justify-start">
                        {score.flags.map((flag) => (
                          <span
                            key={flag}
                            className={`rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium ${
                              flag === "bordered" || flag === "watermarked" || flag === "blurry" || flag === "damage"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {FLAG_LABELS[flag] || flag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Delete button */}
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
                );
              })}

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
    </div>
  );
}
