import { useState, useCallback, useMemo } from "react";

export interface InputRule {
  id: string;
  label: string;
  validate: (value: string) => boolean;
}

export interface EvaluatedRule extends InputRule {
  isValid: boolean;
}

export interface UseInputRulesOptions {
  value?: string;
  rules: InputRule[];
  showOnlyWhenFocused?: boolean;
}

export function useInputRules(
  valueOrOptions: string | UseInputRulesOptions,
  maybeRules?: InputRule[],
) {
  const options: UseInputRulesOptions =
    typeof valueOrOptions === "string"
      ? { value: valueOrOptions, rules: maybeRules ?? [] }
      : valueOrOptions;

  const { value = "", rules = [], showOnlyWhenFocused = true } = options;

  const [isFocused, setIsFocused] = useState(false);

  const evaluatedRules: EvaluatedRule[] = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      isValid: rule.validate(value),
    }));
  }, [rules, value]);

  const allValid = useMemo(() => {
    return evaluatedRules.length > 0 && evaluatedRules.every((r) => r.isValid);
  }, [evaluatedRules]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const shouldShowRules = showOnlyWhenFocused ? isFocused : true;

  return {
    isFocused,
    setIsFocused,
    evaluatedRules,
    allValid,
    shouldShowRules,
    inputProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
  };
}

export default useInputRules;
