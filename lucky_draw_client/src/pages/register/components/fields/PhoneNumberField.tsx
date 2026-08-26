import type { UseFormRegister, FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useInputRules, type InputRule } from "@/hooks/useInputRules";
import { RuleChecklist } from "./RuleChecklist";
import type { RegisterFormValues } from "../../schema";

const PHONE_RULES: InputRule[] = [
  {
    id: "digits-only",
    label: "Hanya boleh angka",
    validate: (val: string) => /^[0-9]+$/.test(val),
  },
  {
    id: "prefix",
    label: "Diawali 08 atau 62",
    validate: (val: string) => /^(08|62)/.test(val),
  },
  {
    id: "length",
    label: "Panjang nomor 10 - 15 digit",
    validate: (val: string) => val.length >= 10 && val.length <= 15,
  },
];

interface PhoneNumberFieldProps {
  register: UseFormRegister<RegisterFormValues>;
  value?: string;
  error?: FieldError;
}

export function PhoneNumberField({
  register,
  value = "",
  error,
}: PhoneNumberFieldProps) {
  const { isFocused, evaluatedRules, inputProps } = useInputRules(
    value,
    PHONE_RULES,
  );
  const phoneRegistration = register("phone_number");

  return (
    <div className="space-y-2">
      <Label htmlFor="phone_number" className="text-foreground font-medium">
        Nomor WhatsApp / HP <span className="text-destructive">*</span>
      </Label>
      <Input
        id="phone_number"
        placeholder="Contoh: 081234567890"
        className="h-12 bg-background/50 focus:bg-background transition-colors rounded-xl font-mono text-sm"
        {...phoneRegistration}
        onFocus={inputProps.onFocus}
        onBlur={(e) => {
          phoneRegistration.onBlur(e);
          inputProps.onBlur();
        }}
      />

      {/* Render live rule checklist with subtle appearance animation */}
      <RuleChecklist
        show={isFocused}
        rules={evaluatedRules}
        title="Ketentuan nomor WhatsApp / HP:"
        className="mt-1.5"
      />

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}

export default PhoneNumberField;
