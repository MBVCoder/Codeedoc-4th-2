const InputCheck = ({
  className = "",
  ...rest
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  return (
    <div>
      <input
        {...rest}
        className={`appearance-none size-4 border-1 checked:border-none rounded-sm hover:cursor-pointer checked:bg-green-600 checked:ring-4 ring-blue-900  ${className}`}
      />
    </div>
  );
};

export default InputCheck;
