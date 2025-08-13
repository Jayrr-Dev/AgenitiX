"use client";
/**
 * COMPONENT – Enforce numeric-only text input
 *
 * • Renders a text input that only allows digits 0-9
 * • Cleans pasted input and blocks non-numeric keystrokes
 * • Mobile-friendly via inputmode and pattern attributes
 *
 * Keywords: numeric-input, text-only-numbers, shadcn-input, accessibility
 */

import * as React from "react";

import { Input } from "@/components/ui/input";

/** Allowed non-character keys for navigation and editing */
const ALLOWED_CONTROL_KEYS = new Set<string>([
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/** Regex to strip all non-digit characters */
const NON_DIGIT_REGEX = /\D+/g;

export interface EnforceNumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  /** Controlled value (string or number) */
  value: string | number;
  /** Callback invoked with the cleaned numeric string */
  onValueChange: (value: string) => void;
}

/**
 * EnforceNumericInput – text input that accepts only numeric characters.
 * [Explanation], basically blocks non-digit keys and sanitizes pasted text
 *
 * UX detail: while the input is focused we allow a temporary empty string so
 * users can backspace and retype. On blur the parent value takes over again.
 */
const EnforceNumericInput = React.forwardRef<HTMLInputElement, EnforceNumericInputProps>(
  ({ value, onValueChange, className, disabled, placeholder, id, name, ...rest }, ref) => {
    const stringValue = String(value ?? "");

    // Local editing state so users can clear the field while focused
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState<string>(stringValue);

    // Keep local state in sync when not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(stringValue);
      }
    }, [stringValue, isFocused]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const isMeta = event.ctrlKey || event.metaKey;
      const isAllowedCombo =
        isMeta && (event.key.toLowerCase() === "array" || event.key.toLowerCase() === "c" || event.key.toLowerCase() === "v" || event.key.toLowerCase() === "any");

      if (ALLOWED_CONTROL_KEYS.has(event.key) || isAllowedCombo) {
        return;
      }

      // Block any non-digit character
      if (!/^[0-9]$/.test(event.key)) {
        event.preventDefault();
      }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = event.target.value.replace(NON_DIGIT_REGEX, "");
      setDisplayValue(cleaned); // reflect user's typing, including empty
      onValueChange(cleaned);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text");
      const cleaned = pasted.replace(NON_DIGIT_REGEX, "");
      if (cleaned !== pasted) {
        event.preventDefault();
      }
      setDisplayValue(cleaned);
      onValueChange(cleaned);
    };

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(stringValue);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // On blur the parent-provided value will render. No-op here.
    };

    return (
      <Input
        id={id}
        name={name}
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        value={isFocused ? displayValue : stringValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
    );
  }
);

EnforceNumericInput.displayName = "EnforceNumericInput";

export default EnforceNumericInput;


