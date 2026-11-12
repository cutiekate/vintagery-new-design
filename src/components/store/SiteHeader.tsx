import { Link } from "@tanstack/react-router";
import { CartDrawer } from "./CartDrawer";
import { RecordToggle } from "./RecordToggle";
import logo from "@/assets/vintagery-logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
        <nav className="hidden flex-1 items-center gap-6 whitespace-nowrap md:flex lg:gap-8">
          <a href="/#catalog" className="eyebrow transition-colors hover:text-primary">
            Каталог
          </a>
          <a href="/#story" className="eyebrow transition-colors hover:text-primary">
            Про нас
          </a>
          {/* The long label only fits beside the logo on wide screens; narrower gets the icon */}
          <span className="hidden xl:inline-flex">
            <RecordToggle variant="text" />
          </span>
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
        <div className="flex flex-1 items-center justify-end gap-1">
          <div className="xl:hidden">
            <RecordToggle variant="icon" />
          </div>
          <CartDrawer />
        </div>
      </div>
      <div className="stripes-70 h-2" aria-hidden />
    </header>
  );
}
