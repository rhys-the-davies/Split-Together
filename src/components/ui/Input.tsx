import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={[
          "block w-full min-h-[44px] px-3 py-2 text-sm rounded-md border bg-white",
          "text-app-text placeholder:text-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50",
          error
            ? "border-danger focus:ring-danger/30 focus:border-danger"
            : "border-neutral-200 focus:ring-primary/30 focus:border-primary",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
