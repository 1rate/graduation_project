import type { ReactNode } from "react";

interface HeadingProps {
  children: ReactNode;
}

export const Heading = ({ children }: HeadingProps) => {
  return <h1 className="text-2xl font-bold">{children}</h1>;
};
