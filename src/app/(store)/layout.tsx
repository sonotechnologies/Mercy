import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
