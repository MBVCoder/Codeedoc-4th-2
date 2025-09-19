const Input = ({
  className = "",
  ...rest
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  return (
      <input
        {...rest}
        className={`w-full rounded-xl border-1 border-white/20 p-2 max-sm:text-sm  text-center focus:outline-0 uppercase placeholder:capitalize ${className}`}
      />
  );
};

export default Input;
