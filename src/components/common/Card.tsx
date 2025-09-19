import React from "react";

const Card = ({
  children,
  className = "",
  ...rest
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  return (
    <div
      {...rest}
      className={`flex flex-col items-center justify-center gap-2 my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
