import { useState, useRef, useEffect, useCallback } from "react";
import type { UseFormSetValue, FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CameraIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import type { RegisterFormValues } from "../../schema";

interface PhotoFieldProps {
  setValue: UseFormSetValue<RegisterFormValues>;
  error?: FieldError | { message?: string };
}

export function PhotoField({ setValue, error }: PhotoFieldProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError(
        "Gagal mengakses kamera. Pastikan izin kamera telah diberikan.",
      );
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((e) => console.error("Failed to play video:", e));
    }
  }, [cameraActive, stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );

        const imageUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageUrl);

        fetch(imageUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "ktp_photo.jpg", {
              type: "image/jpeg",
            });
            setValue("photo", [file], { shouldValidate: true });
          });

        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setValue("photo", undefined);
    startCamera();
  };

  return (
    <div className="space-y-3 pt-4 border-t border-border mt-6">
      <Label className="text-foreground font-medium block">
        Foto Selfie <span className="text-destructive">*</span>
      </Label>

      {cameraError && (
        <p className="text-sm text-destructive mb-2">{cameraError}</p>
      )}

      {!cameraActive && !capturedImage && (
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 h-14 rounded-xl border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-all"
          onClick={startCamera}
        >
          <CameraIcon weight="bold" className="w-5 h-5" />
          <span className="font-semibold">Buka Kamera untuk Selfie</span>
        </Button>
      )}

      {cameraActive && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center ring-2 ring-primary/20 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform scale-x-[-1]"
          ></video>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button
              type="button"
              size="icon"
              className="h-16 w-16 rounded-full bg-white text-primary hover:bg-zinc-100 hover:scale-105 transition-transform border-4 border-white/20 shadow-2xl"
              onClick={capturePhoto}
            >
              <CameraIcon weight="fill" className="w-7 h-7" />
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="relative rounded-xl overflow-hidden aspect-video border-2 border-primary/20 shadow-md group">
          <img
            src={capturedImage}
            alt="Selfie KTP"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              type="button"
              variant="secondary"
              onClick={retakePhoto}
              className="flex items-center gap-2 rounded-full px-6 bg-white text-foreground hover:bg-white/90"
            >
              <ArrowCounterClockwiseIcon weight="bold" /> Ulangi Foto
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {!cameraActive && !capturedImage && (
        <div className="text-xs text-muted-foreground mt-2">
          Syarat dan Ketentuan:
          <ul>
            <li>
              - Foto ini akan digunakan untuk verifikasi pada saat pengundian.
            </li>
            <li>
              - Di harapkan kepada peserta mengisi data dengan jujur dan akurat,
              ketidak sesuaian data dapat mengakibatkan pembatalan hadiah yang
              akan diberikan.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default PhotoField;
