import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">;

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { className, checked, defaultChecked, disabled, onCheckedChange, onClick, ...props },
    ref,
  ) => {
    const isControlled = typeof checked === "boolean";
    const [uncontrolled, setUncontrolled] = React.useState<boolean>(defaultChecked ?? false);
    const isOn = isControlled ? checked : uncontrolled;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        data-state={isOn ? "checked" : "unchecked"}
        onClick={(e) => {
          onClick?.(e);
          if (disabled) return;
          const next = !isOn;
          if (!isControlled) setUncontrolled(next);
          onCheckedChange?.(next);
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-gray-200 bg-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-900",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow-sm transition-transform",
            isOn && "translate-x-5",
          )}
        />
      </button>
    );
  },
);
Switch.displayName = "Switch";

