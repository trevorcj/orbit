import styles from "./input.module.css";

type InputProps = {
  label?: string;
  isRequired?: boolean;
  type?: "text" | "number" | "email" | "password" | "url";
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
  const hasCustomBg = customClassName?.includes("bg-");
  const hasCustomBorder = customClassName?.includes("border-") || customClassName?.includes("border ");

  const baseInputClasses = `w-full h-11 px-3.5 rounded-lg text-sm text-zinc-900 font-medium transition-all duration-200 focus:outline-none focus:border-[#0F86EE] focus:bg-transparent placeholder:text-zinc-400 ${
    hasCustomBg ? "" : "bg-[#F0F6FA]"
  } ${hasCustomBorder ? "" : "border border-transparent"}`;

  return (
    <div className={styles.inputField}>
      {label && (
        <div className={styles.label}>
          <div className="text-xs font-semibold text-zinc-700">{label}</div>
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
          <span className={`${styles.inputIcon} text-zinc-400`}>
            {children}
          </span>
        )}
      </div>
    </div>
  );
}

export default Input;
