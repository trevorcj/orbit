import styles from "./input.module.css";

type InputProps = {
  label?: string;
  isRequired: boolean;
  type: "text" | "number" | "email" | "password";
  placeholder: string;
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Input({
  label,
  isRequired,
  type = "text",
  placeholder,
  children,
  className: customClassName,
  ...props
}: InputProps) {
  const hasCustomBorder = customClassName?.includes("border");

  const baseInputClasses = `w-full p-3 rounded text-zinc-900 dark:text-zinc-100 font-medium transition-all focus:outline-none focus:border-orbit-primary ${
    hasCustomBorder ? "" : "border border-transparent"
  }`;

  return (
    <div className={styles.inputField}>
      {label && (
        <div className={styles.label}>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</div>
          <div className={styles.requiredAsterisk}>{isRequired ? "*" : ""}</div>
        </div>
      )}

      <div className={styles.inputContainer}>
        <input
          className={`${baseInputClasses} ${children ? styles.hasIcon : ""} ${customClassName || ""}`}
          type={type}
          placeholder={placeholder}
          {...props}
        />
        {children && (
          <span className={`${styles.inputIcon} text-zinc-500 dark:text-zinc-400`}>
            {children}
          </span>
        )}
      </div>
    </div>
  );
}

export default Input;
