"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PokerLogo } from "@/components/PokerLogo";

interface Player {
  id: string;
  passcode: string;
  name: string | null;
  nickname: string | null;
  createdAt: string;
  _count: { responses: number };
}

export default function AdminPlayersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState("1");
  const [playerName, setPlayerName] = useState("");
  const [newPasscodes, setNewPasscodes] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/admin/players");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin");
          return;
        }
        throw new Error("Failed to load players");
      }
      const data = await res.json();
      setPlayers(data.players);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setNewPasscodes([]);

    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          count: parseInt(count, 10),
          name: playerName.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate passcodes");
      }

      const data = await res.json();
      setNewPasscodes(data.passcodes);
      setPlayerName("");
      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateName = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() || null }),
      });

      if (!res.ok) {
        throw new Error("Failed to update player");
      }

      setEditingId(null);
      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;

    try {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete player");
      }

      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-dark/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <PokerLogo />
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/dashboard")}>
            ← Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Players</h1>

        {/* Generate Passcodes */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Generate New Players</h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="w-32">
              <Input
                label="Count"
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            {count === "1" && (
              <div className="flex-1 min-w-48">
                <Input
                  label="Name (admin only)"
                  type="text"
                  placeholder="e.g. John, Mike..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>

          {newPasscodes.length > 0 && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-medium mb-2">New passcodes generated:</p>
              <div className="flex flex-wrap gap-2">
                {newPasscodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => copyToClipboard(code)}
                    className="font-mono bg-bg-dark px-3 py-1 rounded text-gold hover:bg-bg-card transition-colors"
                    title="Click to copy"
                  >
                    {code}
                  </button>
                ))}
              </div>
              <p className="text-text-muted text-xs mt-2">Click to copy</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Players List */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            All Players ({players.length})
          </h2>

          {players.length === 0 ? (
            <p className="text-text-muted text-center py-8">No players yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-2 text-text-secondary text-sm font-medium">
                      Name
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary text-sm font-medium">
                      Passcode
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary text-sm font-medium">
                      Nickname
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary text-sm font-medium">
                      Responses
                    </th>
                    <th className="text-right py-3 px-2 text-text-secondary text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-border-subtle/50">
                      <td className="py-3 px-2">
                        {editingId === player.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="bg-bg-dark border border-border-accent rounded px-2 py-1 text-text-primary text-sm w-24"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateName(player.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleUpdateName(player.id)}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(player.id);
                              setEditingName(player.name || "");
                            }}
                            className="text-text-primary hover:text-gold transition-colors"
                            title="Click to edit"
                          >
                            {player.name || <span className="text-text-muted italic">+ Add name</span>}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => copyToClipboard(player.passcode)}
                          className="font-mono text-gold hover:text-gold-light"
                          title="Click to copy"
                        >
                          {player.passcode}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-text-primary">
                        {player.nickname || <span className="text-text-muted italic">—</span>}
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {player._count.responses}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(player.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

