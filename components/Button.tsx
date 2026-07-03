import React from "react";
import styles from "./button.module.css";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "other";
  isLoading?: boolean;
};

function Button({
  className = "",
  variant = "primary",
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const buttonClasses = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClasses} disabled={isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </button>
  );
}

export default Button;
