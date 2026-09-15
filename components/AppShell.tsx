"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const authPages = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const isAuthPage = authPages.some(
    (page) =>
      pathname === page || pathname.startsWith(`${page}/`)
  );

  return (
    <>
      {!isAuthPage && <TopNav />}
      {children}
    </>
  );
}