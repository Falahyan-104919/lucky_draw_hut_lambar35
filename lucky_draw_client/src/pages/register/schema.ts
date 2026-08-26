import * as z from "zod";

export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nama lengkap harus diisi")
    .max(255, "Nama lengkap maksimal 255 karakter")
    .regex(/^[a-zA-Z\s]+$/, "Nama lengkap hanya boleh berisi huruf dan spasi"),
  phone_number: z
    .string()
    .trim()
    .min(1, "Nomor HP harus diisi")
    .max(20, "Nomor HP maksimal 20 digit")
    .regex(/^[0-9]+$/, "Hanya boleh angka"),
  date_of_birth: z
    .string()
    .trim()
    .min(1, "Tanggal lahir harus diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  alamat: z
    .string()
    .trim()
    .min(1, "Alamat wajib diisi")
    .max(255, "Alamat maksimal 255 karakter"),
  photo: z
    .any()
    .refine(
      (files) => Boolean(files && files.length > 0),
      "Foto selfie wajib diambil",
    )
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return files[0]?.size <= MAX_FILE_SIZE;
    }, "Ukuran maksimal file adalah 2MB.")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return ACCEPTED_IMAGE_TYPES.includes(files[0]?.type);
    }, "Hanya format .jpg, .jpeg, .png dan .webp yang diperbolehkan."),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
