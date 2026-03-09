import type { ReactNode } from "react";

interface LayoutProps {
  title: string;
  children: ReactNode;
}

const Layout = ({ title, children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-5 text-2xl font-semibold text-slate-900">
        {title}
      </header>
      <main className="px-8 py-6">{children}</main>
    </div>
  );
};

export default Layout;
