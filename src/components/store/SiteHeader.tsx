import { Link } from "@tanstack/react-router";
import { CartDrawer } from "./CartDrawer";
import logo from "@/assets/vintagery-logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
        <nav className="hidden flex-1 items-center gap-8 md:flex">
          <a href="/#catalog" className="eyebrow transition-colors hover:text-primary">
            Каталог
          </a>
          <a href="/#story" className="eyebrow transition-colors hover:text-primary">
            Про нас
          </a>
        </nav>
        <Link to="/" aria-label="Vintagery — на головну" className="md:flex-none">
          <img
            src={logo}
            alt="Vintagery clothing store"
            width={703}
            height={442}
            className="h-14 w-auto md:h-16"
          />
        </Link>
        <div className="flex flex-1 justify-end">
          <CartDrawer />
        </div>
      </div>
      <div className="stripes-70 h-2" aria-hidden />
    </header>
  );
}
