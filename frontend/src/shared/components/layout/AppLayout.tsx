import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
