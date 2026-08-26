import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WarningCircleIcon } from "@phosphor-icons/react";
import {
  FullNameField,
  DateOfBirthField,
  PhoneNumberField,
  AlamatField,
  PhotoField,
} from "../fields";
import {
  registerSchema,
  type RegisterFormValues,
} from "../../schema";

interface RegisterFormProps {
  isEventStarted: boolean;
  countdownText: string;
}

export function RegisterForm({
  isEventStarted,
  countdownText,
}: RegisterFormProps) {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      date_of_birth: "",
      alamat: "",
      photo: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      let objectName: string | undefined = undefined;

      // 1. Upload photo directly to MinIO
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
      navigate(`/ticket/${data.id}`, { state: { participant: data } });
    },
    onError: (error: AxiosError<any>) => {
      if (error.response?.status === 409) {
        setErrorMsg("NIK sudah terdaftar. Silakan gunakan yang lain.");
      } else if (error.response?.data?.detail) {
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
    <Card className="shadow-2xl border-border bg-card rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-primary via-secondary to-primary"></div>

      <CardHeader className="pt-8 pb-2 text-center">
        <CardTitle className="font-heading text-2xl text-foreground">
          Formulir Registrasi
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm mt-1">
          Mohon isi seluruh data diri Anda dengan sebenar-benarnya.
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

          <FullNameField
            register={register}
            value={watch("full_name")}
            error={errors.full_name}
          />

          <DateOfBirthField
            register={register}
            setValue={setValue}
            value={watch("date_of_birth")}
            error={errors.date_of_birth}
          />

          <PhoneNumberField
            register={register}
            value={watch("phone_number")}
            error={errors.phone_number}
          />

          <AlamatField register={register} error={errors.alamat} />

          <PhotoField setValue={setValue} error={errors.photo} />

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
  );
}

export default RegisterForm;
