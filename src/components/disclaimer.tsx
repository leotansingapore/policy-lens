export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-[#71717a] ${className}`}>
      This is not financial advice. Consult a licensed financial advisor before
      making policy changes.
    </p>
  );
}
