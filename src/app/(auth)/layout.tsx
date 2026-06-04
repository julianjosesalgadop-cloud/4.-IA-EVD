import { redirect } from "next/server";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
