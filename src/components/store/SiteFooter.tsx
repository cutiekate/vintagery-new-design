export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-ink text-ink-foreground">
      <div className="stripes-70 h-6" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-10">
        <div
          className="sunset-rings pointer-events-none absolute -bottom-40 right-0 h-80 w-[40rem] opacity-30"
          aria-hidden
        />
        <p className="relative font-script text-[18vw] pb-4 leading-[1.2] text-mustard md:text-[9rem]">
          Vintagery
        </p>
        <div className="relative mt-8 flex flex-col justify-between gap-4 border-t border-ink-foreground/20 pt-6 text-sm opacity-80 md:flex-row">
          <span>Одяг з історією, відібраний вручну.</span>
          <span>© {new Date().getFullYear()} Vintagery</span>
        </div>
      </div>
    </footer>
  );
}
