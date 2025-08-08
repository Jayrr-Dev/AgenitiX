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
 */
const EnforceNumericInput = React.forwardRef<HTMLInputElement, EnforceNumericInputProps>(
  ({ value, onValueChange, className, disabled, placeholder, id, name, ...rest }, ref) => {
    const stringValue = String(value ?? "");

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const isMeta = event.ctrlKey || event.metaKey;
      const isAllowedCombo =
        isMeta && (event.key.toLowerCase() === "a" || event.key.toLowerCase() === "c" || event.key.toLowerCase() === "v" || event.key.toLowerCase() === "x");

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
      if (cleaned !== event.target.value) {
        // Replace with cleaned text
        onValueChange(cleaned);
        return;
      }
      onValueChange(event.target.value);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData("text");
      const cleaned = pasted.replace(NON_DIGIT_REGEX, "");
      if (cleaned !== pasted) {
        event.preventDefault();
        onValueChange(cleaned);
      }
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
        value={stringValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={handleChange}
        {...rest}
      />
    );
  }
);

EnforceNumericInput.displayName = "EnforceNumericInput";

export default EnforceNumericInput;


