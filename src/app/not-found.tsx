import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-col items-center gap-4 px-5 py-24 text-center lg:py-32">
        <span className="text-[11px] font-semibold tracking-[.18em] text-ochre lg:text-xs">PAGE NOT FOUND</span>
        <h1 className="m-0 font-serif text-[40px] leading-[1.05] font-semibold lg:text-6xl">This pair walked off.</h1>
        <p className="max-w-sm text-muted">The page you&apos;re looking for has moved or sold out. Everything else is still on the shelf.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="grid h-12 place-items-center rounded-full bg-cocoa px-7 font-semibold text-cream hover:bg-mercy">
            Shop all slides
          </Link>
          <Link href="/" className="grid h-12 place-items-center rounded-full border border-cocoa px-7 font-semibold hover:bg-cocoa hover:text-cream">
            Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
