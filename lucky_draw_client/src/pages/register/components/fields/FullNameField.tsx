import type { UseFormRegister, FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useInputRules, type InputRule } from "@/hooks/useInputRules";
import { RuleChecklist } from "./RuleChecklist";
import type { RegisterFormValues } from "../../schema";

const FULL_NAME_RULES: InputRule[] = [
  {
    id: "alphabetical-only",
    label: "Hanya boleh berisi huruf dan spasi (tanpa angka / simbol)",
    validate: (val: string) => val.trim().length > 0 && /^[a-zA-Z\s]+$/.test(val),
  },
  {
    id: "min-length",
    label: "Minimal 3 karakter",
    validate: (val: string) => val.trim().length >= 3,
  },
];

interface FullNameFieldProps {
  register: UseFormRegister<RegisterFormValues>;
  value?: string;
  error?: FieldError;
}

export function FullNameField({
  register,
  value = "",
  error,
}: FullNameFieldProps) {
  const { isFocused, evaluatedRules, inputProps } = useInputRules(
    value,
    FULL_NAME_RULES,
  );
  const nameRegistration = register("full_name");

  return (
    <div className="space-y-2">
      <Label htmlFor="full_name" className="text-foreground font-medium">
        Nama Lengkap <span className="text-destructive">*</span>
      </Label>
      <Input
        id="full_name"
        placeholder="Sesuai KTP Anda"
        className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl"
        {...nameRegistration}
        onFocus={inputProps.onFocus}
        onBlur={(e) => {
          nameRegistration.onBlur(e);
          inputProps.onBlur();
        }}
      />

      {/* Render live rule checklist with subtle appearance animation */}
      <RuleChecklist
        show={isFocused}
        rules={evaluatedRules}
        title="Ketentuan nama lengkap:"
        className="mt-1.5"
      />

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}

export default FullNameField;
