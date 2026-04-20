import { useRef } from 'react';

interface ClassItem {
  id: number;
  name?: string;
  program?: string;
  type?: string;
  instructor?: string;
  dayOfWeek?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  capacity?: number;
  ageMin?: number;
  ageMax?: number;
  room?: string;
}

interface PrintableScheduleProps {
  classes: ClassItem[];
  organizationName?: string;
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const DAY_ABBREV_MAP: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

function normDay(d: string): string {
  return DAY_ABBREV_MAP[d.toLowerCase().trim()] || d.trim();
}

function getClassDays(c: ClassItem): string[] {
  const raw = c.dayOfWeek || '';
  return raw.split(/[,\/]/).map(normDay).filter(Boolean);
}

function getProgram(c: ClassItem): string {
  return c.program || c.type || c.name || 'Uncategorized';
}

function getStartTime(c: ClassItem): string {
  if (c.time) {
    const parts = c.time.split(' - ');
    return parts[0]?.trim() || '';
  }
  if (c.startTime) {
    const [h, m] = c.startTime.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return '';
}

function getEndTime(c: ClassItem): string {
  if (c.time) {
    const parts = c.time.split(' - ');
    return parts[1]?.trim() || '';
  }
  if (c.endTime) {
    const [h, m] = c.endTime.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return '';
}

function getAgeRange(c: ClassItem): string {
  const min = c.ageMin;
  const max = c.ageMax;
  if (min && max) return `${min}–${max} yrs`;
  if (min) return `${min}+ yrs`;
  if (max) return `Up to ${max} yrs`;
  return '';
}

function getDuration(c: ClassItem): string {
  if (c.duration && c.duration > 0) return `${c.duration} min`;
  if (c.startTime && c.endTime) {
    const [sh, sm] = c.startTime.split(':').map(Number);
    const [eh, em] = c.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins > 0) return `${mins} min`;
  }
  return '';
}

// Sort classes by start time (earliest first)
function sortByTime(classes: ClassItem[]): ClassItem[] {
  return [...classes].sort((a, b) => {
    const ta = getStartTime(a);
    const tb = getStartTime(b);
    const toMin = (t: string) => {
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      const ap = m[3].toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    };
    return toMin(ta) - toMin(tb);
  });
}

export function PrintableSchedule({ classes, organizationName }: PrintableScheduleProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Build schedule data grouped by day
    const scheduleByDay: Record<string, { program: string; time: string; endTime: string; instructor: string; duration: string; capacity: string; room: string; ages: string }[]> = {};
    DAY_ORDER.forEach(day => { scheduleByDay[day] = []; });

    classes.forEach(c => {
      const days = getClassDays(c);
      days.forEach(day => {
        if (!scheduleByDay[day]) scheduleByDay[day] = [];
        scheduleByDay[day].push({
          program: getProgram(c),
          time: getStartTime(c),
          endTime: getEndTime(c),
          instructor: c.instructor || '—',
          duration: getDuration(c),
          capacity: c.capacity ? `${c.capacity}` : '—',
          room: c.room || '—',
          ages: getAgeRange(c),
        });
      });
    });

    // Sort each day's classes by time
    DAY_ORDER.forEach(day => {
      scheduleByDay[day].sort((a, b) => {
        const toMin = (t: string) => {
          const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!m) return 0;
          let h = parseInt(m[1]);
          const min = parseInt(m[2]);
          const ap = m[3].toUpperCase();
          if (ap === 'PM' && h !== 12) h += 12;
          if (ap === 'AM' && h === 12) h = 0;
          return h * 60 + min;
        };
        return toMin(a.time) - toMin(b.time);
      });
    });

    const activeDays = DAY_ORDER.filter(day => scheduleByDay[day].length > 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${organizationName || 'DojoFlow'} — Class Schedule</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      padding: 24px 28px;
    }
    /* ── Header ── */
    .print-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .print-header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #111;
    }
    .print-header .subtitle {
      font-size: 12px;
      color: #555;
      margin-top: 3px;
    }
    .print-header .meta {
      text-align: right;
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .print-header .meta strong {
      display: block;
      font-size: 11px;
      color: #333;
    }
    /* ── Day Section ── */
    .day-section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .day-heading {
      background: #111;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 5px 10px;
      border-radius: 3px 3px 0 0;
    }
    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    thead th {
      background: #f4f4f4;
      border: 1px solid #ddd;
      padding: 5px 8px;
      text-align: left;
      font-weight: 600;
      color: #444;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    tbody tr {
      border-bottom: 1px solid #eee;
    }
    tbody tr:nth-child(even) {
      background: #fafafa;
    }
    tbody td {
      padding: 6px 8px;
      border: 1px solid #e8e8e8;
      vertical-align: middle;
      color: #222;
    }
    .program-name {
      font-weight: 600;
      color: #111;
    }
    .time-range {
      font-weight: 600;
      color: #c0392b;
      white-space: nowrap;
    }
    .instructor-name {
      color: #333;
    }
    .meta-pill {
      display: inline-block;
      background: #f0f0f0;
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 9px;
      color: #555;
      margin-right: 3px;
    }
    /* ── Footer ── */
    .print-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #888;
    }
    /* ── Summary strip ── */
    .summary-strip {
      display: flex;
      gap: 24px;
      margin-bottom: 18px;
      padding: 10px 14px;
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .summary-item { text-align: center; }
    .summary-item .num { font-size: 18px; font-weight: 700; color: #111; }
    .summary-item .label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 1px; }
    @media print {
      body { padding: 16px 20px; }
      .day-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1>${organizationName || 'Class Schedule'}</h1>
      <div class="subtitle">Weekly Class Schedule — All Programs</div>
    </div>
    <div class="meta">
      <strong>Printed on</strong>
      ${today}
      <br>Total Classes: ${classes.length}
    </div>
  </div>

  <div class="summary-strip">
    ${activeDays.map(day => `
      <div class="summary-item">
        <div class="num">${scheduleByDay[day].length}</div>
        <div class="label">${DAY_FULL[day]}</div>
      </div>
    `).join('')}
    <div class="summary-item" style="margin-left:auto">
      <div class="num">${classes.length}</div>
      <div class="label">Total Slots</div>
    </div>
  </div>

  ${activeDays.map(day => `
    <div class="day-section">
      <div class="day-heading">${DAY_FULL[day]} &mdash; ${scheduleByDay[day].length} class${scheduleByDay[day].length !== 1 ? 'es' : ''}</div>
      <table>
        <thead>
          <tr>
            <th style="width:22%">Program</th>
            <th style="width:16%">Time</th>
            <th style="width:18%">Instructor</th>
            <th style="width:10%">Duration</th>
            <th style="width:10%">Capacity</th>
            <th style="width:10%">Ages</th>
            <th style="width:14%">Room</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleByDay[day].map(row => `
            <tr>
              <td class="program-name">${row.program}</td>
              <td class="time-range">${row.time}${row.endTime ? ' – ' + row.endTime : ''}</td>
              <td class="instructor-name">${row.instructor}</td>
              <td>${row.duration || '—'}</td>
              <td>${row.capacity}</td>
              <td>${row.ages || '—'}</td>
              <td>${row.room}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="print-footer">
    <span>Generated by DojoFlow &mdash; ${organizationName || ''}</span>
    <span>${today}</span>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <button
      onClick={handlePrint}
      className="h-9 px-3 text-sm font-medium rounded-lg border flex items-center gap-1.5 transition-colors"
      style={{
        borderColor: '#e0e0e0',
        background: '#fff',
        color: '#333',
      }}
      title="Print weekly schedule"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print Schedule
    </button>
  );
}
