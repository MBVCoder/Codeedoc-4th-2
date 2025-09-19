const ButtonBlack = ({
  children,
  className,
  ...rest
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) => {
  return (
      <button
        {...rest}
        className={`bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl ${className}`}
      >
        {children}
      </button>
  );
};

export default ButtonBlack;
