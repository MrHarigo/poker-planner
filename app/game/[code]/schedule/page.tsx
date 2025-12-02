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
  type DaySchedule,
} from "@/lib/utils";

interface ScheduleData {
  game: {
    name: string;
    daySchedules: DaySchedule[];
    rateOptions: string[];
  };
  totalResponses: number;
  slotCounts: Record<string, { can: number; maybe: number }>;
  rateCounts: Record<string, { preferred: number; playable: number }>;
}

export default function SchedulePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ScheduleData | null>(null);

  useEffect(() => {
    const passcode = sessionStorage.getItem("playerPasscode");
    if (!passcode) {
      router.push("/");
      return;
    }

    fetchSchedule(passcode);
  }, [code, router]);

  const fetchSchedule = async (passcode: string) => {
    try {
      const res = await fetch(`/api/games/${code}/schedule`, {
        headers: { "x-passcode": passcode },
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.clear();
          router.push("/");
          return;
        }
        throw new Error("Failed to load schedule");
      }

      const scheduleData: ScheduleData = await res.json();
      setData(scheduleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
    } finally {
      setLoading(false);
    }
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
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  const slots = generateTimeSlotsFromSchedules(data.game.daySchedules);
  const groupedSlots = groupSlotsByNight(slots, data.game.daySchedules);
  const maxPeople = data.totalResponses;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <div className="flex items-center gap-4">
            <a
              href={`/game/${code}`}
              className="text-gold hover:text-gold-light text-sm font-medium"
            >
              ← Edit Response
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
            {data.totalResponses} {data.totalResponses === 1 ? "response" : "responses"} so far
          </p>
        </div>

        {/* Rate Preferences Summary */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Rate Interest</h3>
          <div className="space-y-3">
            {data.game.rateOptions.map((rate) => {
              const counts = data.rateCounts[rate] || { preferred: 0, playable: 0 };
              const total = counts.preferred + counts.playable;
              const preferredWidth = maxPeople > 0 ? (counts.preferred / maxPeople) * 100 : 0;
              const playableWidth = maxPeople > 0 ? (counts.playable / maxPeople) * 100 : 0;

              return (
                <div key={rate} className="p-3 bg-bg-dark rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-medium text-text-primary">{rate}</span>
                    <span className="text-sm text-text-secondary">
                      {counts.preferred}★ {counts.playable}✓ ({total} total)
                    </span>
                  </div>
                  <div className="h-3 bg-bg-card rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${preferredWidth}%` }}
                    />
                    <div
                      className="h-full bg-status-playable transition-all"
                      style={{ width: `${playableWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gold rounded" /> Preferred
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-status-playable rounded" /> Playable
            </span>
          </div>
        </Card>

        {/* Time Availability */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Availability</h3>

          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([dateKey, { label, slots: dateSlots }]) => (
              <div key={dateKey}>
                <h4 className="font-medium text-gold mb-3">{label}</h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {dateSlots.map((slot) => {
                    const counts = data.slotCounts[slot] || { can: 0, maybe: 0 };
                    const total = counts.can + counts.maybe;
                    const intensity = maxPeople > 0 ? total / maxPeople : 0;

                    return (
                      <div
                        key={slot}
                        className="p-3 rounded-lg border border-border-subtle bg-bg-dark"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(34, 197, 94, ${intensity * 0.3})`
                            : undefined,
                        }}
                      >
                        <div className="text-xs text-text-muted">{formatTime(slot)}</div>
                        <div className="mt-1 flex items-center gap-2">
                          {counts.can > 0 && (
                            <span className="text-status-can font-medium">
                              {counts.can}✓
                            </span>
                          )}
                          {counts.maybe > 0 && (
                            <span className="text-status-maybe font-medium">
                              {counts.maybe}?
                            </span>
                          )}
                          {counts.can === 0 && counts.maybe === 0 && (
                            <span className="text-text-muted">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="text-status-can">✓</span> Can play
            </span>
            <span className="flex items-center gap-1">
              <span className="text-status-maybe">?</span> Maybe
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}

