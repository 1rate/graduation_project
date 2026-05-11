import type { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
}

export const Page = ({ children }: PageProps) => {
  return <div className="space-y-6">{children}</div>;
};
