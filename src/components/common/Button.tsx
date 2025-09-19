import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "black";
}

const Button = ({
  className = "",
  onClick,
  children,
  type = "button",
  variant = "default",
  ...rest
}: ButtonProps) => {
  const variants = {
    default:
      "bg-transparent border-1 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2",
    black:
      "bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
