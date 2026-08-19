import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as dateFnsId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  WarningCircleIcon,
  ArrowCounterClockwiseIcon,
  CameraIcon,
  CalendarIcon,
} from "@phosphor-icons/react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const registerSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap harus diisi").max(255),
  phone_number: z
    .string()
    .min(1, "Nomor HP harus diisi")
    .max(20)
    .regex(/^[0-9]+$/, "Hanya boleh angka"),
  date_of_birth: z
    .string()
    .min(1, "Tanggal lahir harus diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  alamat: z
    .string()
    .min(1, "Alamat Wajib di isi")
    .max(255, "Alamat maksimal 255 karakter"),
  photo: z
    .any()
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return files[0]?.size <= MAX_FILE_SIZE;
    }, `Ukuran maksimal file adalah 2MB.`)
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return ACCEPTED_IMAGE_TYPES.includes(files[0]?.type);
    }, "Hanya format .jpg, .jpeg, .png dan .webp yang diperbolehkan."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [countdownText, setCountdownText] = useState("");

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

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

  useEffect(() => {
    const startTimeStr = import.meta.env.VITE_EVENT_START_TIME;
    if (!startTimeStr) {
      setIsEventStarted(true);
      return;
    }

    const checkTime = () => {
      const startTime = new Date(startTimeStr).getTime();
      const now = new Date().getTime();

      if (now >= startTime) {
        setIsEventStarted(true);
        setCountdownText("");
      } else {
        setIsEventStarted(false);
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdownText(`Buka dalam ${days}h ${hours}j ${minutes}m`);
        } else {
          const h = hours.toString().padStart(2, "0");
          const m = minutes.toString().padStart(2, "0");
          const s = seconds.toString().padStart(2, "0");
          setCountdownText(`Buka dalam ${h}:${m}:${s}`);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      let objectName: string | undefined = undefined;

      // 1. If there is a photo, get upload URL and upload directly to MinIO
      if (data.photo && data.photo.length > 0) {
        const file = data.photo[0];

        // Get Pre-signed URL with Content-Type
        const urlResponse = await axios.get(
          `/api/participants/upload-url?content_type=${encodeURIComponent(file.type)}`,
        );
        const { url, object_name } = urlResponse.data;

        // Upload file to MinIO
        await axios.put(url, file, {
          headers: {
            "Content-Type": file.type,
          },
        });

        objectName = object_name;
      }

      // 2. Submit the registration payload as JSON
      const payload = {
        full_name: data.full_name,
        alamat: data.alamat,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        photo_url: objectName,
      };

      const response = await axios.post("/api/participants", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data;
    },
    onSuccess: (data) => {
      navigate(`/ticket/${data.id}`);
    },
    onError: (error: AxiosError<any>) => {
      if (error.response?.status === 409) {
        setErrorMsg("NIK sudah terdaftar. Silakan gunakan yang lain.");
      } else if (error.response?.data?.detail) {
        // Handle FastAPI 422 Validation Error which returns an array
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          setErrorMsg(detail.map((err) => err.msg).join(", "));
        } else {
          setErrorMsg(detail);
        }
      } else {
        setErrorMsg("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
      }
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    if (!isEventStarted) return;
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl z-10 relative mt-8 mb-16">
        <div className="text-center mb-10">
          <img
            src="/logo_hut_lambar-35.png"
            alt="HUT Lampung Barat 35"
            className="w-36 h-auto mx-auto mb-6 drop-shadow-sm"
          />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-heading">
            HUT Lampung Barat ke-35
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Daftar sekarang untuk mendapatkan{" "}
            <span className="font-semibold text-primary">
              Kupon Undian Digital
            </span>
          </p>
        </div>

        <Card className="shadow-2xl border-border bg-card rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-primary via-secondary to-primary"></div>

          <CardHeader className="pt-8 pb-2 text-center">
            <CardTitle className="font-heading text-2xl text-foreground">
              Formulir Registrasi
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Mohon isi data diri Anda dengan sebenar-benarnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8 pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errorMsg && (
                <div className="p-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl flex items-start gap-3">
                  <WarningCircleIcon
                    className="w-5 h-5 shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <span className="font-medium leading-relaxed">
                    {errorMsg}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-foreground font-medium"
                >
                  Nama Lengkap
                </Label>
                <Input
                  id="full_name"
                  placeholder="Sesuai KTP Anda"
                  className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">
                    {errors.full_name.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="date_of_birth"
                  className="text-foreground font-medium"
                >
                  Tanggal Lahir
                </Label>
                <input type="hidden" {...register("date_of_birth")} />
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-12 bg-background/50 focus:bg-background transition-colors rounded-xl justify-start text-left font-normal border-input hover:bg-background/80",
                        !watch("date_of_birth") && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("date_of_birth") ? (
                        format(new Date(watch("date_of_birth")), "PPP", {
                          locale: dateFnsId,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        watch("date_of_birth")
                          ? new Date(watch("date_of_birth"))
                          : undefined
                      }
                      onSelect={(date) => {
                        setValue(
                          "date_of_birth",
                          date ? format(date, "yyyy-MM-dd") : "",
                          { shouldValidate: true },
                        );
                      }}
                      captionLayout="dropdown"
                      startMonth={new Date(1900, 0)}
                      endMonth={new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">
                    {errors.date_of_birth.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone_number"
                  className="text-foreground font-medium"
                >
                  Nomor WhatsApp / HP
                </Label>
                <Input
                  id="phone_number"
                  placeholder="Contoh: 081234567890"
                  className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl font-mono text-sm"
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="text-sm text-destructive">
                    {errors.phone_number.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat" className="text-foreground font-medium">
                  Alamat (Kelurahan/Pekon)
                </Label>
                <Input
                  id="alamat"
                  placeholder="Masukkan kelurahan atau pekon"
                  className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl"
                  {...register("alamat")}
                />
                {errors.alamat && (
                  <p className="text-sm text-destructive">
                    {errors.alamat.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-border mt-6">
                <Label className="text-foreground font-medium block">
                  Foto Selfie (Opsional)
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
                    <span className="font-semibold">
                      Buka Kamera untuk Selfie
                    </span>
                  </Button>
                )}

                {cameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center ring-2 ring-primary/20 shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={
                        "w-full h-full object-cover transition-transform scale-x-[-1]"
                      }
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

                {errors.photo && (
                  <p className="text-sm text-destructive">
                    {errors.photo.message as string}
                  </p>
                )}
                {!cameraActive && !capturedImage && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Foto ini akan digunakan untuk verifikasi pada saat
                    pengundian.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-8 h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mutation.isPending || !isEventStarted}
              >
                {!isEventStarted
                  ? countdownText || "Memuat..."
                  : mutation.isPending
                    ? "Sedang Mendaftarkan..."
                    : "Daftarkan Sekarang"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm font-medium text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Lampung Barat
        </p>
      </div>
    </div>
  );
}
