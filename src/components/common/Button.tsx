const Button = ({
  className,
  onClick,
  children,
  type,
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) => {
  return (
    <div>
      <button
        type={type}
        onClick={onClick}
        className={`bg-transparent border-1 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2 ${className}`}
      >
        {children}
      </button>
    </div>
  );
};

export default Button;
