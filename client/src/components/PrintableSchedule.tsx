import { trpc } from '@/lib/trpc';

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

function buildScheduleHtml(
  classes: ClassItem[],
  schoolName: string,
  logoBase64: string,
  today: string
): string {
  const scheduleByDay: Record<string, {
    program: string; time: string; endTime: string;
    instructor: string; duration: string; capacity: string;
    room: string; ages: string;
  }[]> = {};
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

  // Sort each day's classes by start time
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

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${schoolName} logo" style="height:52px;max-width:180px;object-fit:contain;display:block;" />`
    : `<div style="width:52px;height:52px;border-radius:8px;background:#ef4444;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;">${schoolName.charAt(0).toUpperCase()}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${schoolName} — Class Schedule</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      padding: 28px 32px;
    }
    .print-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      margin-bottom: 6px;
      border-bottom: 3px solid #ef4444;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-text h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #111; line-height: 1.1; }
    .header-text .tagline { font-size: 11px; color: #ef4444; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
    .header-right { text-align: right; font-size: 10px; color: #666; line-height: 1.7; }
    .header-right .date-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; }
    .header-right .date-value { font-size: 11px; font-weight: 600; color: #333; }
    .header-right .total-badge { display: inline-block; background: #ef4444; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-top: 4px; }
    .summary-strip { display: flex; gap: 0; margin: 14px 0 18px; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
    .summary-item { flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid #e8e8e8; }
    .summary-item:last-child { border-right: none; }
    .summary-item .num { font-size: 17px; font-weight: 800; color: #111; line-height: 1; }
    .summary-item .label { font-size: 8.5px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px; }
    .summary-item.total-item { background: #fef2f2; }
    .summary-item.total-item .num { color: #ef4444; }
    .day-section { margin-bottom: 16px; page-break-inside: avoid; }
    .day-heading { background: #111; color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 5px 10px; border-radius: 4px 4px 0 0; display: flex; align-items: center; justify-content: space-between; }
    .day-heading .count-badge { background: rgba(255,255,255,0.2); border-radius: 10px; padding: 1px 8px; font-size: 9px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead th { background: #f6f6f6; border: 1px solid #e0e0e0; padding: 5px 8px; text-align: left; font-weight: 700; color: #555; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 6px 8px; border: 1px solid #ebebeb; vertical-align: middle; color: #222; }
    .program-name { font-weight: 700; color: #111; }
    .time-range { font-weight: 700; color: #c0392b; white-space: nowrap; }
    .print-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #aaa; }
    @media print { body { padding: 16px 20px; } .day-section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="header-left">
      ${logoHtml}
      <div class="header-text">
        <h1>${schoolName}</h1>
        <div class="tagline">Weekly Class Schedule</div>
      </div>
    </div>
    <div class="header-right">
      <div class="date-label">Printed on</div>
      <div class="date-value">${today}</div>
      <div class="total-badge">${classes.length} Total Classes</div>
    </div>
  </div>

  <div class="summary-strip">
    ${activeDays.map(day => `
      <div class="summary-item">
        <div class="num">${scheduleByDay[day].length}</div>
        <div class="label">${DAY_FULL[day]}</div>
      </div>
    `).join('')}
    <div class="summary-item total-item">
      <div class="num">${classes.length}</div>
      <div class="label">Total</div>
    </div>
  </div>

  ${activeDays.map(day => `
    <div class="day-section">
      <div class="day-heading">
        <span>${DAY_FULL[day]}</span>
        <span class="count-badge">${scheduleByDay[day].length} class${scheduleByDay[day].length !== 1 ? 'es' : ''}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:22%">Program</th>
            <th style="width:16%">Time</th>
            <th style="width:18%">Instructor</th>
            <th style="width:10%">Duration</th>
            <th style="width:10%">Capacity</th>
            <th style="width:10%">Ages</th>
            <th style="width:14%">Room / Mat</th>
          </tr>
        </thead>
        <tbody>
          ${scheduleByDay[day].map(row => `
            <tr>
              <td class="program-name">${row.program}</td>
              <td class="time-range">${row.time}${row.endTime ? ' &ndash; ' + row.endTime : ''}</td>
              <td>${row.instructor}</td>
              <td>${row.duration || '&mdash;'}</td>
              <td>${row.capacity}</td>
              <td>${row.ages || '&mdash;'}</td>
              <td>${row.room}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="print-footer">
    <span>${schoolName} &mdash; All rights reserved</span>
    <span style="font-size:8px;color:#ccc;">Powered by DojoFlow</span>
    <span>${today}</span>
  </div>
</body>
</html>`;
}

export function PrintableSchedule({ classes }: PrintableScheduleProps) {
  const { data: profile } = trpc.schoolProfile.get.useQuery();

  const schoolName = profile?.schoolName || profile?.displayName || 'Class Schedule';
  const logoUrl = (profile as any)?.logoLightUrl || (profile as any)?.logoDarkUrl || null;

  const handlePrint = () => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Open the window SYNCHRONOUSLY first (required to avoid popup blocker)
    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      alert('Please allow popups for this site to use the Print Schedule feature.');
      return;
    }

    // Show a loading state immediately
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Loading...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#666;">
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Preparing schedule...</div>
        <div style="font-size:13px;">This will open the print dialog automatically.</div>
      </div>
    </body></html>`);
    printWindow.document.close();

    // Now do the async work (logo fetch) and update the window
    const doRender = async () => {
      let logoBase64 = '';
      if (logoUrl) {
        try {
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          // Logo fetch failed — use fallback initial badge
          logoBase64 = '';
        }
      }

      const html = buildScheduleHtml(classes, schoolName, logoBase64, today);

      // Replace the loading content with the real schedule
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      // Trigger print after content loads
      setTimeout(() => {
        printWindow.print();
      }, 600);
    };

    doRender();
  };

  return (
    <button
      onClick={handlePrint}
      className="h-9 px-3 text-sm font-medium rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-gray-50"
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
