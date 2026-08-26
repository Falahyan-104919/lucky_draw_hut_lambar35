import { motion, AnimatePresence } from "framer-motion";
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
  if (rules.length === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
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
                <motion.li
                  key={rule.id}
                  layout="position"
                  className={`flex items-center gap-2 transition-colors duration-150 ${
                    rule.isValid
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {rule.isValid ? (
                      <motion.span
                        key="valid"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="shrink-0 flex items-center justify-center"
                      >
                        <CheckCircle
                          weight="fill"
                          className="w-4 h-4 text-emerald-500"
                        />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="pending"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="shrink-0 flex items-center justify-center ml-0.5 mr-0.5"
                      >
                        <Circle
                          weight="bold"
                          className="w-3.5 h-3.5 opacity-40"
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{rule.label}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RuleChecklist;
