import { CheckCircle, Circle } from "@phosphor-icons/react";
import type { EvaluatedRule } from "@/hooks/useInputRules";

export interface RuleChecklistProps {
  rules: EvaluatedRule[];
  title?: string;
  className?: string;
  show?: boolean;
}

export function RuleChecklist({
  rules,
  title = "Ketentuan pengisian:",
  className = "",
  show = true,
}: RuleChecklistProps) {
  if (rules.length === 0 || !show) return null;

  return (
    <div className="overflow-hidden transition-all duration-200 ease-out animate-in fade-in-0 slide-in-from-top-1">
      <div
        className={`p-3 rounded-xl bg-muted/60 border border-border/70 space-y-1.5 text-xs shadow-xs ${className}`}
      >
        {title && (
          <p className="font-semibold text-foreground/90 text-[11px] uppercase tracking-wider mb-1">
            {title}
          </p>
        )}
        <ul className="space-y-1.5">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={`flex items-center gap-2 transition-colors duration-150 ${
                rule.isValid
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <span className="shrink-0 flex items-center justify-center">
                {rule.isValid ? (
                  <CheckCircle
                    weight="fill"
                    className="w-4 h-4 text-emerald-500 animate-in zoom-in-50 duration-150"
                  />
                ) : (
                  <Circle
                    weight="bold"
                    className="w-3.5 h-3.5 opacity-40 ml-0.5 mr-0.5"
                  />
                )}
              </span>
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RuleChecklist;
