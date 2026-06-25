export function Banner({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-md border border-cyan-400/40 bg-black/80 px-4 py-2 font-mono text-xs text-cyan-100 shadow-[0_0_20px_rgba(34,224,255,0.3)] backdrop-blur">
      {text}
    </div>
  );
}
