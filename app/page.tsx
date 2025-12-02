"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PokerLogo } from "@/components/PokerLogo";

export default function HomePage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameCode: gameCode.toUpperCase().trim(),
          passcode: passcode.toUpperCase().trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join game");
        return;
      }

      // Store player session
      sessionStorage.setItem("playerId", data.playerId);
      sessionStorage.setItem("playerPasscode", passcode.toUpperCase().trim());

      // Navigate to game page
      router.push(`/game/${data.gameCode}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-5 rotate-12">♠</div>
        <div className="absolute top-40 right-20 text-8xl opacity-5 -rotate-12">♥</div>
        <div className="absolute bottom-32 left-1/4 text-7xl opacity-5 rotate-45">♦</div>
        <div className="absolute bottom-20 right-1/3 text-5xl opacity-5 -rotate-6">♣</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PokerLogo />
          </div>
          <p className="text-text-secondary mt-2">
            Enter your game code and passcode to join
          </p>
        </div>

        <Card variant="elevated">
          <form onSubmit={handleJoin} className="space-y-5">
            <Input
              label="Game Code"
              placeholder="POKER-XXXX"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              className="font-mono tracking-wider"
            />

            <Input
              label="Your Passcode"
              placeholder="XXXXXX"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              className="font-mono tracking-wider"
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Joining...
                </span>
              ) : (
                "Join Game"
              )}
            </Button>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-text-muted hover:text-gold text-sm transition-colors"
          >
            Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}
