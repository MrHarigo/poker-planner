"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PokerLogo } from "@/components/PokerLogo";
import { DaySchedule, getHourOptions, formatHour } from "@/lib/utils";

const DEFAULT_RATES = ["25-50", "50-100", "100-200"];
const HOUR_OPTIONS = getHourOptions();

// Default poker night hours: 6pm to 5am
const DEFAULT_START_HOUR = 18;
const DEFAULT_END_HOUR = 5;

export default function NewGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [rateOptions, setRateOptions] = useState<string[]>(DEFAULT_RATES);
  const [newRate, setNewRate] = useState("");
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);

  const addRate = () => {
    if (newRate && !rateOptions.includes(newRate)) {
      setRateOptions([...rateOptions, newRate]);
      setNewRate("");
    }
  };

  const removeRate = (rate: string) => {
    setRateOptions(rateOptions.filter((r) => r !== rate));
  };

  const addDay = (dateStr: string) => {
    if (!dateStr) return;
    if (daySchedules.some((s) => s.date === dateStr)) return;

    setDaySchedules([
      ...daySchedules,
      { date: dateStr, startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR },
    ].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const removeDay = (date: string) => {
    setDaySchedules(daySchedules.filter((s) => s.date !== date));
  };

  const updateDaySchedule = (date: string, field: "startHour" | "endHour", value: number) => {
    setDaySchedules(
      daySchedules.map((s) => (s.date === date ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (rateOptions.length === 0) {
        throw new Error("Please add at least one rate option");
      }

      if (daySchedules.length === 0) {
        throw new Error("Please add at least one day");
      }

      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rateOptions,
          daySchedules,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create game");
      }

      const data = await res.json();
      router.push(`/admin/games/${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  // Set default dates to this weekend (Fri, Sat, Sun)
  const setThisWeekend = () => {
    const today = new Date();
    const friday = new Date(today);
    friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7));

    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    const toDateStr = (d: Date) => d.toISOString().split("T")[0];

    setDaySchedules([
      { date: toDateStr(friday), startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR },
      { date: toDateStr(saturday), startHour: 13, endHour: DEFAULT_END_HOUR },
      { date: toDateStr(sunday), startHour: 13, endHour: 0 },
    ]);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getTimeRangeLabel = (schedule: DaySchedule) => {
    const isOvernight = schedule.endHour <= schedule.startHour;
    if (isOvernight) {
      return `${formatHour(schedule.startHour)} → ${formatHour(schedule.endHour)} (+1 day)`;
    }
    return `${formatHour(schedule.startHour)} → ${formatHour(schedule.endHour)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/dashboard")}>
            ← Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Create New Game</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Name */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Game Details</h2>
            <Input
              label="Game Name"
              placeholder="e.g., Weekend Poker Night"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Card>

          {/* Rate Options */}
          <Card>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Rate Options</h2>
            <p className="text-text-secondary text-sm mb-4">
              Add the blind levels players can choose from
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {rateOptions.map((rate) => (
                <div
                  key={rate}
                  className="flex items-center gap-2 bg-bg-dark px-3 py-1.5 rounded-lg"
                >
                  <span className="font-mono text-gold">{rate}</span>
                  <button
                    type="button"
                    onClick={() => removeRate(rate)}
                    className="text-text-muted hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., 200-400"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addRate}>
                Add
              </Button>
            </div>
          </Card>

          {/* Day Schedules */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Schedule</h2>
              <Button type="button" variant="ghost" size="sm" onClick={setThisWeekend}>
                Set This Weekend
              </Button>
            </div>

            <p className="text-text-secondary text-sm mb-4">
              Add days and set time ranges for each. Overnight sessions (e.g., 6 PM → 5 AM) are supported.
            </p>

            {/* Existing schedules */}
            {daySchedules.length > 0 && (
              <div className="space-y-3 mb-4">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.date}
                    className="p-4 bg-bg-dark rounded-lg border border-border-subtle"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gold">
                        {formatDateLabel(schedule.date)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDay(schedule.date)}
                        className="text-text-muted hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-text-secondary">From:</label>
                        <select
                          value={schedule.startHour}
                          onChange={(e) =>
                            updateDaySchedule(schedule.date, "startHour", parseInt(e.target.value))
                          }
                          className="bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-text-primary"
                        >
                          {HOUR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-text-secondary">To:</label>
                        <select
                          value={schedule.endHour}
                          onChange={(e) =>
                            updateDaySchedule(schedule.date, "endHour", parseInt(e.target.value))
                          }
                          className="bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-text-primary"
                        >
                          {HOUR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-text-muted text-sm">
                        ({getTimeRangeLabel(schedule)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new day */}
            <div className="flex gap-2 items-center">
              <input
                type="date"
                onChange={(e) => addDay(e.target.value)}
                className="flex-1 px-4 py-3 bg-bg-card border border-border-subtle rounded-lg text-text-primary"
              />
              <span className="text-text-muted text-sm">Click a date to add</span>
            </div>
          </Card>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Game"}
          </Button>
        </form>
      </main>
    </div>
  );
}
