import React from "react";
import styles from "./button.module.css";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "other";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "h-8 px-3 text-xs"
      : size === "lg"
        ? "h-12 px-6 text-sm sm:text-base font-semibold"
        : "h-11 px-5 text-xs sm:text-sm font-semibold";

  const buttonClasses = `${styles.button} ${styles[variant]} ${sizeClasses} ${className}`;

  return (
    <button className={buttonClasses} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? "Please wait..." : children}
    </button>
  );
}

export default Button;
