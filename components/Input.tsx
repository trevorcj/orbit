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

  const baseInputClasses = `w-full p-3 rounded text-black font-medium transition-all focus:outline-none focus:border-orbit-primary ${
    hasCustomBorder ? "" : "border border-transparent"
  }`;

  return (
    <div className={styles.inputField}>
      <div className={styles.label}>
        <div className={styles.labelText}>{label}</div>
        <div className={styles.requiredAsterisk}>{isRequired ? "*" : ""}</div>
      </div>

      <div className={styles.inputContainer}>
        <input
          className={`${baseInputClasses} ${children ? styles.hasIcon : ""} ${customClassName || ""}`}
          type={type}
          placeholder={placeholder}
          {...props}
        />
        {children && (
          <span className={`${styles.inputIcon} text-zinc-500`}>
            {children}
          </span>
        )}
      </div>
    </div>
  );
}

export default Input;
