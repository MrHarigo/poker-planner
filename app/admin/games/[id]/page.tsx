"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PokerLogo } from "@/components/PokerLogo";
import {
  generateTimeSlotsFromSchedules,
  groupSlotsByNight,
  formatTime,
  formatHour,
  parseJSON,
  type DaySchedule,
  type RatePreference,
  type TimeSlotAvailability,
} from "@/lib/utils";

interface Player {
  id: string;
  nickname: string | null;
  passcode: string;
}

interface GameResponse {
  id: string;
  player: Player;
  ratePreferences: Record<string, RatePreference>;
  timeSlots: Record<string, TimeSlotAvailability>;
  updatedAt: string;
}

interface GameData {
  game: {
    id: string;
    gameCode: string;
    name: string;
    rateOptions: string[];
    daySchedules: DaySchedule[];
    isVisible: boolean;
  };
  responses: GameResponse[];
}

export default function AdminGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/admin/games/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Failed to load game");
      }
      const gameData = await res.json();
      
      // Parse JSON fields in responses
      gameData.responses = gameData.responses.map((r: { ratePreferences: string; timeSlots: string }) => ({
        ...r,
        ratePreferences: parseJSON(r.ratePreferences, {}),
        timeSlots: parseJSON(r.timeSlots, {}),
      }));
      
      setData(gameData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async () => {
    if (!data) return;
    setToggling(true);

    try {
      const res = await fetch(`/api/admin/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !data.game.isVisible }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      fetchGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setToggling(false);
    }
  };

  const copyGameCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.game.gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const { game, responses } = data;
  const slots = generateTimeSlotsFromSchedules(game.daySchedules);
  const groupedSlots = groupSlotsByNight(slots, game.daySchedules);

  // Format schedule summary
  const formatScheduleSummary = (schedules: DaySchedule[]) => {
    return schedules.map((s) => {
      const date = new Date(s.date + "T12:00:00");
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      return `${dayName} ${formatHour(s.startHour)}-${formatHour(s.endHour)}`;
    }).join(", ");
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/dashboard")}>
            ← Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Game Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{game.name}</h1>
              {!game.isVisible && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                  Hidden
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={copyGameCode}
                className="font-mono text-gold hover:text-gold-light text-lg"
              >
                {game.gameCode}
              </button>
              {copied && <span className="text-xs text-green-400">Copied!</span>}
            </div>
            <p className="text-text-secondary text-sm mt-1">
              {formatScheduleSummary(game.daySchedules)}
            </p>
          </div>

          <Button
            variant={game.isVisible ? "danger" : "primary"}
            onClick={toggleVisibility}
            disabled={toggling}
          >
            {toggling ? "..." : game.isVisible ? "Hide Game" : "Make Visible"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-2xl font-bold text-gold">{responses.length}</div>
            <div className="text-text-muted text-sm">Responses</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-status-can">
              {responses.filter((r) =>
                Object.values(r.timeSlots).some((s) => s === "can")
              ).length}
            </div>
            <div className="text-text-muted text-sm">Available</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-gold">{game.rateOptions.length}</div>
            <div className="text-text-muted text-sm">Rate Options</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-text-primary">{slots.length}</div>
            <div className="text-text-muted text-sm">Time Slots</div>
          </Card>
        </div>

        {responses.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-text-muted text-lg">No responses yet</p>
            <p className="text-text-secondary mt-2">
              Share the game code <span className="font-mono text-gold">{game.gameCode}</span> with your friends
            </p>
          </Card>
        ) : (
          <>
            {/* Rate Preferences Table */}
            <Card className="mb-6 overflow-x-auto">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Rate Preferences</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-2 px-3 text-text-secondary font-medium">Player</th>
                    {game.rateOptions.map((rate) => (
                      <th key={rate} className="text-center py-2 px-3 text-text-secondary font-medium font-mono">
                        {rate}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response) => (
                    <tr key={response.id} className="border-b border-border-subtle/50">
                      <td className="py-2 px-3 text-text-primary font-medium">
                        {response.player.nickname || response.player.passcode}
                      </td>
                      {game.rateOptions.map((rate) => {
                        const pref = response.ratePreferences[rate];
                        return (
                          <td key={rate} className="text-center py-2 px-3">
                            <RateBadge pref={pref} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Time Availability */}
            <Card className="overflow-x-auto">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Time Availability</h2>

              {Object.entries(groupedSlots).map(([dateKey, { label, slots: dateSlots }]) => (
                <div key={dateKey} className="mb-6 last:mb-0">
                  <h3 className="text-gold font-medium mb-3">{label}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th className="text-left py-2 px-2 text-text-secondary font-medium min-w-[120px]">
                            Player
                          </th>
                          {dateSlots.map((slot) => (
                            <th
                              key={slot}
                              className="text-center py-2 px-1 text-text-secondary font-medium text-xs min-w-[50px]"
                            >
                              {formatTime(slot)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((response) => (
                          <tr key={response.id} className="border-b border-border-subtle/50">
                            <td className="py-2 px-2 text-text-primary font-medium whitespace-nowrap">
                              {response.player.nickname || response.player.passcode}
                            </td>
                            {dateSlots.map((slot) => {
                              const status = response.timeSlots[slot];
                              return (
                                <td key={slot} className="text-center py-2 px-1">
                                  <StatusBadge status={status} />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr className="bg-bg-dark">
                          <td className="py-2 px-2 text-text-secondary font-medium">Total</td>
                          {dateSlots.map((slot) => {
                            const canCount = responses.filter(
                              (r) => r.timeSlots[slot] === "can"
                            ).length;
                            const maybeCount = responses.filter(
                              (r) => r.timeSlots[slot] === "maybe"
                            ).length;
                            return (
                              <td key={slot} className="text-center py-2 px-1 text-xs">
                                {canCount > 0 && (
                                  <span className="text-status-can font-medium">{canCount}</span>
                                )}
                                {canCount > 0 && maybeCount > 0 && "/"}
                                {maybeCount > 0 && (
                                  <span className="text-status-maybe font-medium">{maybeCount}</span>
                                )}
                                {canCount === 0 && maybeCount === 0 && (
                                  <span className="text-text-muted">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-status-can/30 rounded flex items-center justify-center text-status-can">✓</span>
                  Can
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-status-maybe/30 rounded flex items-center justify-center text-status-maybe">?</span>
                  Maybe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 bg-bg-card rounded flex items-center justify-center text-text-muted">-</span>
                  Unavailable
                </span>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function RateBadge({ pref }: { pref?: RatePreference }) {
  if (!pref) return <span className="text-text-muted">—</span>;

  const styles = {
    preferred: "bg-gold/20 text-gold",
    playable: "bg-status-playable/20 text-status-playable",
    wont_play: "bg-red-500/20 text-red-400",
  };

  const labels = {
    preferred: "★",
    playable: "✓",
    wont_play: "✗",
  };

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${styles[pref]}`}>
      {labels[pref]}
    </span>
  );
}

function StatusBadge({ status }: { status?: TimeSlotAvailability }) {
  if (!status || status === "unavailable") {
    return <span className="inline-block w-6 h-6 rounded bg-bg-card text-text-muted text-xs leading-6">-</span>;
  }

  const styles = {
    can: "bg-status-can/30 text-status-can",
    maybe: "bg-status-maybe/30 text-status-maybe",
  };

  const labels = {
    can: "✓",
    maybe: "?",
  };

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

