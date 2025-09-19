import React from "react";

const Track = ({
  className = "",
  children,
  ...rest
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) => {
  return (
    <div {...rest} className={`${className}`}>
      {children}
    </div>
  );
};

export default Track;
