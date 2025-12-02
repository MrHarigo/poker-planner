export function PokerLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Stacked cards effect */}
        <div className="absolute -left-1 -top-1 w-8 h-10 bg-white/10 rounded transform -rotate-12 border border-white/20" />
        <div className="absolute left-0 top-0 w-8 h-10 bg-white/20 rounded transform -rotate-6 border border-white/30" />
        <div className="relative w-8 h-10 bg-gradient-to-br from-gold to-gold-dark rounded flex items-center justify-center border border-gold-light">
          <span className="text-bg-darkest font-bold text-lg">♠</span>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Poker<span className="text-gold">Planner</span>
        </h1>
      </div>
    </div>
  );
}

