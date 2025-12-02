"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PokerLogo } from "@/components/PokerLogo";
import { formatDateTime } from "@/lib/utils";

interface Game {
  id: string;
  gameCode: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
  isVisible: boolean;
  _count: { responses: number };
}

interface Player {
  id: string;
  passcode: string;
  nickname: string | null;
}

interface DashboardData {
  games: Game[];
  players: Player[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Failed to load dashboard");
      }
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    sessionStorage.removeItem("adminToken");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <p className="text-red-400 mb-4">{error || "Failed to load"}</p>
          <Button onClick={() => router.push("/admin")}>Back to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <div className="flex items-center gap-4">
            <span className="text-text-secondary text-sm">Admin</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-gold">{data.games.length}</div>
            <div className="text-text-secondary text-sm mt-1">Games</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gold">{data.players.length}</div>
            <div className="text-text-secondary text-sm mt-1">Players</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-gold">
              {data.games.filter((g) => g.isVisible).length}
            </div>
            <div className="text-text-secondary text-sm mt-1">Active Games</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Games Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Games</h2>
              <Button size="sm" onClick={() => router.push("/admin/games/new")}>
                + New Game
              </Button>
            </div>

            <div className="space-y-3">
              {data.games.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-text-muted">No games yet</p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => router.push("/admin/games/new")}
                  >
                    Create First Game
                  </Button>
                </Card>
              ) : (
                data.games.map((game) => (
                  <Card
                    key={game.id}
                    className="cursor-pointer hover:border-gold/50 transition-colors"
                    onClick={() => router.push(`/admin/games/${game.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary">{game.name}</h3>
                          {!game.isVisible && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted text-sm font-mono mt-1">
                          {game.gameCode}
                        </p>
                        <p className="text-text-secondary text-sm mt-2">
                          {formatDateTime(game.startDateTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gold">
                          {game._count.responses}
                        </div>
                        <div className="text-text-muted text-xs">responses</div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Players Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Players</h2>
              <Button size="sm" onClick={() => router.push("/admin/players")}>
                Manage
              </Button>
            </div>

            <Card>
              {data.players.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-muted">No players yet</p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => router.push("/admin/players")}
                  >
                    Generate Passcodes
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.players.slice(0, 10).map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded bg-bg-dark"
                    >
                      <span className="text-text-primary">
                        {player.nickname || <span className="text-text-muted italic">No nickname</span>}
                      </span>
                      <span className="font-mono text-sm text-gold">{player.passcode}</span>
                    </div>
                  ))}
                  {data.players.length > 10 && (
                    <p className="text-text-muted text-sm text-center pt-2">
                      +{data.players.length - 10} more players
                    </p>
                  )}
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

