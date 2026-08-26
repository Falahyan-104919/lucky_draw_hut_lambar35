import type { UseFormRegister, FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { RegisterFormValues } from "../../schema";

interface AlamatFieldProps {
  register: UseFormRegister<RegisterFormValues>;
  error?: FieldError;
}

export function AlamatField({ register, error }: AlamatFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="alamat" className="text-foreground font-medium">
        Alamat (Kelurahan/Pekon) <span className="text-destructive">*</span>
      </Label>
      <Input
        id="alamat"
        placeholder="Masukkan kelurahan atau pekon"
        className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl"
        {...register("alamat")}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}

export default AlamatField;
