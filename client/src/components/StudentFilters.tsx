import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface StudentFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  programFilter: string
  onProgramChange: (program: string) => void
  beltFilter: string
  onBeltChange: (belt: string) => void
  attendanceFilter: string
  onAttendanceChange: (attendance: string) => void
  riskFilter: string
  onRiskChange: (risk: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  activeFilters: number
  onClearFilters: () => void
}

const PROGRAMS = [
  'All Programs',
  'Youth Karate',
  'Adult Karate',
  'Kickboxing',
  'MMA',
  'Muay Thai',
  'Brazilian Jiu-Jitsu'
]

const BELT_RANKS = [
  'All Belts',
  'White Belt',
  'Yellow Belt',
  'Green Belt',
  'Blue Belt',
  'Brown Belt',
  'Black Belt'
]

const ATTENDANCE_LEVELS = [
  'All Attendance',
  'Excellent (90%+)',
  'Good (70-89%)',
  'Fair (50-69%)',
  'Poor (<50%)'
]

const RISK_LEVELS = [
  'All Students',
  'At Risk',
  'Inactive',
  'On Hold',
  'Active'
]

const SORT_OPTIONS = [
  { value: 'last-seen', label: 'Last Seen' },
  { value: 'newest', label: 'Newest' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'belt-rank', label: 'Belt Rank' },
  { value: 'name', label: 'Name (A-Z)' }
]

export default function StudentFilters({
  searchQuery,
  onSearchChange,
  programFilter,
  onProgramChange,
  beltFilter,
  onBeltChange,
  attendanceFilter,
  onAttendanceChange,
  riskFilter,
  onRiskChange,
  sortBy,
  onSortChange,
  activeFilters,
  onClearFilters
}: StudentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Program Filter */}
        <select
          value={programFilter}
          onChange={(e) => onProgramChange(e.target.value)}
          className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
        >
          {PROGRAMS.map(program => (
            <option key={program} value={program === 'All Programs' ? '' : program}>
              {program}
            </option>
          ))}
        </select>

        {/* Belt Rank Filter */}
        <select
          value={beltFilter}
          onChange={(e) => onBeltChange(e.target.value)}
          className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
        >
          {BELT_RANKS.map(belt => (
            <option key={belt} value={belt === 'All Belts' ? '' : belt}>
              {belt}
            </option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={riskFilter}
          onChange={(e) => onRiskChange(e.target.value)}
          className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
        >
          {RISK_LEVELS.map(risk => (
            <option key={risk} value={risk === 'All Students' ? '' : risk}>
              {risk}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 font-medium text-sm ${
            showAdvanced
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              : 'bg-slate-800/50 border-white/10 text-slate-300 hover:border-white/20'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">More</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-800/30 border border-white/10 rounded-lg">
          {/* Attendance Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
              Attendance Level
            </label>
            <select
              value={attendanceFilter}
              onChange={(e) => onAttendanceChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              {ATTENDANCE_LEVELS.map(level => (
                <option key={level} value={level === 'All Attendance' ? '' : level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Info text */}
          <div className="flex items-center justify-end">
            <p className="text-xs text-slate-400">
              {activeFilters > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                    {activeFilters}
                  </span>
                  filter{activeFilters !== 1 ? 's' : ''} active
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <span className="text-xs font-medium text-blue-300">Active filters:</span>
          
          {programFilter && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              <span>{programFilter}</span>
              <button
                onClick={() => onProgramChange('')}
                className="hover:text-blue-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {beltFilter && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              <span>{beltFilter}</span>
              <button
                onClick={() => onBeltChange('')}
                className="hover:text-blue-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {riskFilter && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              <span>{riskFilter}</span>
              <button
                onClick={() => onRiskChange('')}
                className="hover:text-blue-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {attendanceFilter && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
              <span>{attendanceFilter}</span>
              <button
                onClick={() => onAttendanceChange('')}
                className="hover:text-blue-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={onClearFilters}
            className="ml-auto text-xs font-medium text-blue-300 hover:text-blue-200 transition-colors px-2 py-1 rounded hover:bg-blue-500/10"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
