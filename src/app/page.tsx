import { BaseFinder } from "@/components/BaseFinder";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-edge bg-panel/80 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wider text-ink">
            Rust <span className="text-rust">Base</span> Finder
          </h1>
          <p className="hidden text-sm text-muted sm:block">Find the best place to build on your server&apos;s map.</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        <BaseFinder />
      </main>

      <footer className="border-t border-edge px-4 py-3 text-center text-xs text-muted">
        Map data and images from{" "}
        <a className="underline hover:text-ink" href="https://rustmaps.com" target="_blank" rel="noreferrer">
          RustMaps.com
        </a>
        . Rust Base Finder is a fan project, not affiliated with Facepunch Studios or RustMaps.
      </footer>
    </div>
  );
}
