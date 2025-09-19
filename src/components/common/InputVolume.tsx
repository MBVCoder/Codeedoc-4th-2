const InputVolume = ({
  className = "",
  ...rest
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  return <input {...rest} className={`w-full h-full ${className}`} />;
};

export default InputVolume;
