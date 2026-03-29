/**
 * Call History Table Component
 * 
 * Displays a detailed table of past calls with filtering, sorting, and pagination.
 * Shows recipient, duration, credits spent, and call date/time.
 */

import React, { useState, useMemo } from 'react';
import { Phone, Clock, Zap, Calendar, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface CallRecord {
  id: number;
  recipientPhone: string;
  durationSeconds: number;
  durationMinutes: number;
  roundedMinutes: number;
  creditsDeducted: number;
  callId: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface CallHistoryTableProps {
  calls: CallRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

type SortField = 'date' | 'duration' | 'cost' | 'recipient';
type SortOrder = 'asc' | 'desc';

export const CallHistoryTable: React.FC<CallHistoryTableProps> = ({
  calls,
  isLoading = false,
  onRefresh,
  compact = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = compact ? 10 : 25;

  // Filter and sort calls
  const filteredAndSortedCalls = useMemo(() => {
    let filtered = calls.filter(call =>
      call.recipientPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'duration':
          compareValue = a.durationSeconds - b.durationSeconds;
          break;
        case 'cost':
          compareValue = a.creditsDeducted - b.creditsDeducted;
          break;
        case 'recipient':
          compareValue = a.recipientPhone.localeCompare(b.recipientPhone);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [calls, sortField, sortOrder, searchTerm]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedCalls.length / itemsPerPage);
  const paginatedCalls = filteredAndSortedCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No call history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by phone number or description..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">
                <button
                  onClick={() => handleSort('recipient')}
                  className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Phone className="w-4 h-4" />
                  Recipient
                  <SortIcon field="recipient" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Calendar className="w-4 h-4" />
                  Date & Time
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">
                <button
                  onClick={() => handleSort('duration')}
                  className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Clock className="w-4 h-4" />
                  Duration
                  <SortIcon field="duration" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">
                <button
                  onClick={() => handleSort('cost')}
                  className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Zap className="w-4 h-4" />
                  Credits
                  <SortIcon field="cost" />
                </button>
              </th>
              {!compact && (
                <th className="text-left px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Description
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedCalls.map((call) => (
              <tr
                key={call.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                  {call.recipientPhone}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(call.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDuration(call.durationSeconds)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({call.roundedMinutes}m billed)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {call.creditsDeducted}
                    </span>
                  </div>
                </td>
                {!compact && (
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate">
                    {call.description}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedCalls.length)} of{' '}
            {filteredAndSortedCalls.length} calls
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📊 Total: {filteredAndSortedCalls.length} calls | 
          ⏱️ {Math.round(filteredAndSortedCalls.reduce((sum, c) => sum + c.durationSeconds, 0) / 60)}m duration | 
          ⚡ {filteredAndSortedCalls.reduce((sum, c) => sum + c.creditsDeducted, 0)} credits
        </p>
      </div>
    </div>
  );
};

export default CallHistoryTable;
