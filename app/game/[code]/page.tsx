"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PokerLogo } from "@/components/PokerLogo";
import {
  generateTimeSlotsFromSchedules,
  groupSlotsByNight,
  formatTime,
  type DaySchedule,
  type RatePreference,
  type TimeSlotAvailability,
} from "@/lib/utils";

interface GameData {
  game: {
    id: string;
    gameCode: string;
    name: string;
    rateOptions: string[];
    daySchedules: DaySchedule[];
  };
  player: {
    id: string;
    nickname: string | null;
  };
  response: {
    ratePreferences: Record<string, RatePreference>;
    timeSlots: Record<string, TimeSlotAvailability>;
  } | null;
}

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<GameData | null>(null);

  // Form state
  const [nickname, setNickname] = useState("");
  const [ratePreferences, setRatePreferences] = useState<Record<string, RatePreference>>({});
  const [timeSlots, setTimeSlots] = useState<Record<string, TimeSlotAvailability>>({});

  useEffect(() => {
    const passcode = sessionStorage.getItem("playerPasscode");
    if (!passcode) {
      router.push("/");
      return;
    }

    fetchGame(passcode);
  }, [code, router]);

  const fetchGame = async (passcode: string) => {
    try {
      const res = await fetch(`/api/games/${code}`, {
        headers: { "x-passcode": passcode },
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        throw new Error("Failed to load game");
      }

      const gameData: GameData = await res.json();
      setData(gameData);

      // Initialize form with existing data or defaults
      setNickname(gameData.player.nickname || "");

      // Initialize rate preferences
      const defaultRates: Record<string, RatePreference> = {};
      for (const rate of gameData.game.rateOptions) {
        defaultRates[rate] = gameData.response?.ratePreferences[rate] || "playable";
      }
      setRatePreferences(defaultRates);

      // Initialize time slots
      const slots = generateTimeSlotsFromSchedules(gameData.game.daySchedules);
      const defaultSlots: Record<string, TimeSlotAvailability> = {};
      for (const slot of slots) {
        defaultSlots[slot] = gameData.response?.timeSlots[slot] || "unavailable";
      }
      setTimeSlots(defaultSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const passcode = sessionStorage.getItem("playerPasscode");
    if (!passcode) {
      router.push("/");
      return;
    }

    if (!nickname.trim()) {
      setError("Please enter a nickname");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/games/${code}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-passcode": passcode,
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          ratePreferences,
          timeSlots,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save response");
      }

      // Navigate to schedule page on success
      router.push(`/game/${code}/schedule`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setRatePref = (rate: string, pref: RatePreference) => {
    setRatePreferences((prev) => ({ ...prev, [rate]: pref }));
  };

  const setSlotAvailability = (slot: string, availability: TimeSlotAvailability) => {
    setTimeSlots((prev) => ({ ...prev, [slot]: availability }));
  };

  // Bulk actions for time slots
  const setAllSlotsForDate = (dateKey: string, availability: TimeSlotAvailability) => {
    const grouped = data ? groupSlotsByNight(Object.keys(timeSlots), data.game.daySchedules) : {};
    const slotsForDate = grouped[dateKey]?.slots || [];
    setTimeSlots((prev) => {
      const updated = { ...prev };
      for (const slot of slotsForDate) {
        updated[slot] = availability;
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const groupedSlots = groupSlotsByNight(Object.keys(timeSlots), data.game.daySchedules);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <div className="flex items-center gap-4">
            <a
              href={`/game/${code}/schedule`}
              className="text-gold hover:text-gold-light text-sm font-medium"
            >
              View Schedule →
            </a>
            <button
              onClick={() => {
                sessionStorage.clear();
                router.push("/");
              }}
              className="text-text-muted hover:text-text-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{data.game.name}</h2>
          <p className="text-text-secondary mt-1">
            Fill out your availability and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nickname */}
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Your Nickname</h3>
            <Input
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={20}
            />
          </Card>

          {/* Rate Preferences */}
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Rate Preferences</h3>
            <p className="text-text-secondary text-sm mb-4">
              Select your preference for each rate
            </p>

            <div className="space-y-3">
              {data.game.rateOptions.map((rate) => (
                <div
                  key={rate}
                  className="flex items-center justify-between p-3 bg-bg-dark rounded-lg"
                >
                  <span className="font-mono font-medium text-text-primary">{rate}</span>
                  <div className="flex gap-2">
                    <RateButton
                      active={ratePreferences[rate] === "preferred"}
                      onClick={() => setRatePref(rate, "preferred")}
                      color="gold"
                    >
                      Preferred
                    </RateButton>
                    <RateButton
                      active={ratePreferences[rate] === "playable"}
                      onClick={() => setRatePref(rate, "playable")}
                      color="blue"
                    >
                      Playable
                    </RateButton>
                    <RateButton
                      active={ratePreferences[rate] === "wont_play"}
                      onClick={() => setRatePref(rate, "wont_play")}
                      color="red"
                    >
                      Won&apos;t Play
                    </RateButton>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Time Availability */}
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Time Availability</h3>
            <p className="text-text-secondary text-sm mb-4">
              Select when you can play
            </p>

            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([dateKey, { label, slots }]) => (
                <div key={dateKey}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gold">{label}</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAllSlotsForDate(dateKey, "can")}
                        className="text-xs px-2 py-1 rounded bg-status-can/20 text-status-can hover:bg-status-can/30"
                      >
                        All Can
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllSlotsForDate(dateKey, "maybe")}
                        className="text-xs px-2 py-1 rounded bg-status-maybe/20 text-status-maybe hover:bg-status-maybe/30"
                      >
                        All Maybe
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllSlotsForDate(dateKey, "unavailable")}
                        className="text-xs px-2 py-1 rounded bg-bg-card text-text-muted hover:bg-bg-card-hover"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <TimeSlotButton
                        key={slot}
                        time={formatTime(slot)}
                        status={timeSlots[slot]}
                        onStatusChange={(status) => setSlotAvailability(slot, status)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving..." : data.response ? "Update Response" : "Submit Response"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

// Rate preference button component
function RateButton({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: "gold" | "blue" | "red";
  children: React.ReactNode;
}) {
  const colors = {
    gold: active
      ? "bg-gold text-bg-darkest"
      : "bg-bg-card text-text-muted hover:text-gold hover:border-gold/50",
    blue: active
      ? "bg-status-playable text-bg-darkest"
      : "bg-bg-card text-text-muted hover:text-status-playable hover:border-status-playable/50",
    red: active
      ? "bg-status-wont-play text-white"
      : "bg-bg-card text-text-muted hover:text-status-wont-play hover:border-status-wont-play/50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded border border-border-subtle transition-all ${colors[color]}`}
    >
      {children}
    </button>
  );
}

// Time slot button component
function TimeSlotButton({
  time,
  status,
  onStatusChange,
}: {
  time: string;
  status: TimeSlotAvailability;
  onStatusChange: (status: TimeSlotAvailability) => void;
}) {
  const cycleStatus = () => {
    const next: Record<TimeSlotAvailability, TimeSlotAvailability> = {
      unavailable: "can",
      can: "maybe",
      maybe: "unavailable",
    };
    onStatusChange(next[status]);
  };

  const statusStyles = {
    can: "bg-status-can/20 border-status-can text-status-can",
    maybe: "bg-status-maybe/20 border-status-maybe text-status-maybe",
    unavailable: "bg-bg-card border-border-subtle text-text-muted",
  };

  const statusLabels = {
    can: "Can",
    maybe: "Maybe",
    unavailable: "—",
  };

  return (
    <button
      type="button"
      onClick={cycleStatus}
      className={`p-3 rounded-lg border text-sm font-medium transition-all hover:scale-105 ${statusStyles[status]}`}
    >
      <div className="text-xs opacity-70">{time}</div>
      <div className="mt-1">{statusLabels[status]}</div>
    </button>
  );
}

