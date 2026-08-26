import type { UseFormRegister, UseFormSetValue, FieldError } from "react-hook-form";
import { format } from "date-fns";
import { id as dateFnsId } from "date-fns/locale";
import { CalendarIcon } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { RegisterFormValues } from "../../schema";

interface DateOfBirthFieldProps {
  register: UseFormRegister<RegisterFormValues>;
  setValue: UseFormSetValue<RegisterFormValues>;
  value?: string;
  error?: FieldError;
}

export function DateOfBirthField({
  register,
  setValue,
  value,
  error,
}: DateOfBirthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="date_of_birth" className="text-foreground font-medium">
        Tanggal Lahir <span className="text-destructive">*</span>
      </Label>
      <input type="hidden" {...register("date_of_birth")} />
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={"outline"}
              className={cn(
                "w-full h-12 bg-background/50 focus:bg-background transition-colors rounded-xl justify-start text-left font-normal border-input hover:bg-background/80",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                format(new Date(value), "PPP", {
                  locale: dateFnsId,
                })
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
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
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}

export default DateOfBirthField;
