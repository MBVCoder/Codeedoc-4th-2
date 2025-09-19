const Controller = ({
  className = "",
  onClick,
  children,
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  return (
    <div
      className={`hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Controller;
