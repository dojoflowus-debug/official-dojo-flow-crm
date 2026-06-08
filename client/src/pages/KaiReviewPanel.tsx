/**
 * KaiReviewPanel.tsx
 * Admin panel for reviewing Kai task feedback, support tickets, and credit refund claims.
 * Accessible from the sidebar under Settings → Kai Reviews (or via direct route).
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_review" | "resolved" | "closed" | "refunded";
type TicketFilter = TicketStatus | "all";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "bg-red-500/20 text-red-400 border-red-500/30",
  in_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  refunded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-500 text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#f59e0b" : "#374151"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KaiReviewPanel() {
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [creditsRefunded, setCreditsRefunded] = useState(0);
  const [newStatus, setNewStatus] = useState<TicketStatus>("open");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'cinematic';
  const isCinematic = theme === 'cinematic';

  const { data: stats } = trpc.kaiReview.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: ticketsData, refetch: refetchTickets } =
    trpc.kaiReview.listTickets.useQuery(
      { status: filter, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      { keepPreviousData: true }
    );

  const updateTicket = trpc.kaiReview.updateTicket.useMutation({
    onSuccess: () => {
      refetchTickets();
      setSelectedTicket(null);
      toast.success("Ticket updated successfully");
    },
    onError: () => toast.error("Failed to update ticket"),
  });

  function openTicket(ticket: any) {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.adminNotes ?? "");
    setCreditsRefunded(ticket.creditsRefunded ?? 0);
    setNewStatus(ticket.status as TicketStatus);
  }

  function handleUpdate() {
    if (!selectedTicket) return;
    updateTicket.mutate({
      ticketId: selectedTicket.id,
      status: newStatus,
      adminNotes: adminNotes.trim() || undefined,
      creditsRefunded: creditsRefunded || undefined,
    });
  }

  const tickets = ticketsData?.tickets ?? [];
  const total = ticketsData?.total ?? 0;

  // ── Theme ────────────────────────────────────────────────────────────────────
  // Night mode (dark): deep charcoal with sunset warmth
  // Cinema mode (cinematic): near-black with purple/blue cinematic tint
  const bg = isCinematic
    ? "bg-[#0a0a12]"
    : isDark
    ? "bg-[#111118]"
    : "bg-gray-50";
  const cardBg = isCinematic
    ? "bg-[#13131f] border-[#2a2a3e]"
    : isDark
    ? "bg-[#1a1a22] border-[#2a2a30]"
    : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isCinematic ? "text-purple-300/70" : isDark ? "text-amber-100/60" : "text-gray-500";
  const borderColor = isCinematic ? "border-[#2a2a3e]" : isDark ? "border-[#2a2a30]" : "border-gray-200";
  const inputClass = isCinematic
    ? "bg-[#1e1e30] border-[#3a3a50] text-gray-100 placeholder-gray-600"
    : isDark
    ? "bg-[#1e1e26] border-[#3a3a40] text-gray-100 placeholder-gray-600"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";
  const rowHover = isCinematic ? "hover:bg-[#1e1e30]" : isDark ? "hover:bg-[#1e1e26]" : "hover:bg-gray-50";

  return (
    <div className={`min-h-screen ${bg} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Kai Review Center</h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>
          Manage post-task feedback, support tickets, and credit refund claims
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Avg Rating",
              value: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : "—",
              color: "text-yellow-400",
            },
            {
              label: "Total Reviews",
              value: stats.totalReviews.toString(),
              color: textPrimary,
            },
            {
              label: "Open Tickets",
              value: stats.openTickets.toString(),
              color: stats.openTickets > 0 ? "text-red-400" : "text-green-400",
            },
            {
              label: "Total Tickets",
              value: stats.totalTickets.toString(),
              color: textPrimary,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${cardBg} p-4`}
            >
              <p className={`text-xs ${textSecondary} mb-1`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className={`flex gap-1 mb-4 border-b ${borderColor} pb-2`}>
        {(["all", "open", "in_review", "resolved", "closed", "refunded"] as TicketFilter[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : isCinematic
                  ? "text-purple-300/60 hover:text-purple-100 hover:bg-[#1e1e30]"
                  : isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-[#1e1e26]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f as TicketStatus]}
              {f === "open" && stats?.openTickets ? (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {stats.openTickets}
                </span>
              ) : null}
            </button>
          )
        )}
      </div>

      {/* Ticket Table */}
      <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${borderColor}`}>
              {["Ticket", "Subject", "Rating", "Credits", "Priority", "Status", "Created", ""].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wide`}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className={`px-4 py-12 text-center ${textSecondary} text-sm`}>
                  No tickets found
                </td>
              </tr>
            )}
            {tickets.map((ticket: any) => (
              <tr
                key={ticket.id}
                className={`border-b ${borderColor} ${rowHover} cursor-pointer transition-colors`}
                onClick={() => openTicket(ticket)}
              >
                <td className={`px-4 py-3 font-mono text-xs ${textSecondary}`}>
                  {ticket.ticketNumber}
                </td>
                <td className={`px-4 py-3 ${textPrimary} max-w-xs`}>
                  <p className="truncate font-medium">{ticket.subject}</p>
                  {ticket.taskSummary && (
                    <p className={`text-xs ${textSecondary} truncate mt-0.5`}>
                      {ticket.taskSummary}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StarDisplay rating={ticket.starRating} />
                </td>
                <td className={`px-4 py-3 text-xs ${textSecondary}`}>
                  {ticket.creditsRequested > 0 ? (
                    <span className="text-orange-400 font-medium">
                      {ticket.creditsRefunded > 0
                        ? `${ticket.creditsRefunded}/${ticket.creditsRequested} refunded`
                        : `${ticket.creditsRequested} requested`}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`px-4 py-3 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? textSecondary}`}>
                  {ticket.priority}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[ticket.status as TicketStatus] ?? ""
                    }`}
                  >
                    {STATUS_LABELS[ticket.status as TicketStatus] ?? ticket.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-xs ${textSecondary} whitespace-nowrap`}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); openTicket(ticket); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${borderColor}`}>
            <p className={`text-xs ${textSecondary}`}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs rounded border border-gray-600 text-gray-300 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="px-3 py-1 text-xs rounded border border-gray-600 text-gray-300 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Slide-Over */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSelectedTicket(null)}
          />
          {/* Panel */}
          <div
            className={`w-full max-w-lg ${isCinematic ? 'bg-[#13131f]' : isDark ? 'bg-[#1a1a22]' : 'bg-white'} shadow-2xl flex flex-col`}
          >
            {/* Panel Header */}
            <div className={`flex items-start justify-between p-6 border-b ${borderColor}`}>
              <div>
                <p className={`font-mono text-xs ${textSecondary} mb-1`}>
                  {selectedTicket.ticketNumber}
                </p>
                <h2 className={`text-lg font-bold ${textPrimary}`}>
                  {selectedTicket.subject}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <StarDisplay rating={selectedTicket.starRating} />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[selectedTicket.status as TicketStatus] ?? ""
                    }`}
                  >
                    {STATUS_LABELS[selectedTicket.status as TicketStatus]}
                  </span>
                  <span className={`text-xs ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                    {selectedTicket.priority} priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className={`${textSecondary} hover:opacity-70 text-xl leading-none`}
              >
                ✕
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Task Summary */}
              {selectedTicket.taskSummary && (
                <div>
                  <p className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide mb-1`}>
                    Task
                  </p>
                  <p className={`text-sm ${textPrimary}`}>{selectedTicket.taskSummary}</p>
                </div>
              )}

              {/* User Feedback */}
              {selectedTicket.description && (
                <div>
                  <p className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide mb-1`}>
                    User Feedback
                  </p>
                  <p className={`text-sm ${textPrimary} whitespace-pre-wrap`}>
                    {selectedTicket.description}
                  </p>
                </div>
              )}

              {/* Credits */}
              {selectedTicket.creditsRequested > 0 && (
                <div className={`rounded-lg border ${isDark ? "border-orange-500/30 bg-orange-950/20" : "border-orange-200 bg-orange-50"} p-3`}>
                  <p className={`text-xs font-semibold ${isDark ? "text-orange-300" : "text-orange-700"} mb-2`}>
                    Credit Refund Request
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className={`text-xs ${textSecondary}`}>Requested</p>
                      <p className={`text-lg font-bold ${isDark ? "text-orange-300" : "text-orange-700"}`}>
                        {selectedTicket.creditsRequested}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary}`}>Refund Amount</p>
                      <input
                        type="number"
                        min={0}
                        max={selectedTicket.creditsRequested}
                        value={creditsRefunded}
                        onChange={(e) => setCreditsRefunded(Number(e.target.value))}
                        className={`w-24 px-2 py-1 rounded border text-sm ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <p className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide mb-2`}>
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["open", "in_review", "resolved", "closed", "refunded"] as TicketStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setNewStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          newStatus === s
                            ? STATUS_COLORS[s]
                            : isDark
                            ? "border-gray-600 text-gray-400 hover:border-gray-500"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <p className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide mb-2`}>
                  Internal Notes
                </p>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for your team (not visible to the user)…"
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none ${inputClass}`}
                />
              </div>

              {/* Metadata */}
              <div className={`text-xs ${textSecondary} space-y-1`}>
                <p>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                {selectedTicket.resolvedAt && (
                  <p>Resolved: {new Date(selectedTicket.resolvedAt).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className={`p-6 border-t ${borderColor} flex gap-3`}>
              <button
                onClick={handleUpdate}
                disabled={updateTicket.isLoading}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {updateTicket.isLoading ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
