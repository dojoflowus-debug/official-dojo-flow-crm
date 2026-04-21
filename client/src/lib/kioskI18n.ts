/**
 * kioskI18n — Kiosk internationalization (i18n) utility
 * Supports English (en) and Spanish (es)
 */

export type KioskLang = 'en' | 'es';

export const KIOSK_TRANSLATIONS = {
  en: {
    tapToCheckIn: '🔥 TAP TO CHECK IN 🔥',
    newStudent: 'New Student',
    bookFreeTrial: 'Book a Free Trial',
    enrollNow: 'Enroll Now',
    buyDayPass: 'Buy a Day Pass',
    playArcadeGames: 'Play Arcade Games',
    walkInsWelcome: 'Walk-ins Welcome',
    startToday: 'Start Today',
    noCommitment: 'No Commitment',
    classSchedule: 'Class Schedule',
    attendanceLeaderboard: 'Attendance Leaderboard',
    beltPromotion: 'Belt Promotion',
    checkIn: 'Check In',
    searchName: 'Search by name...',
    welcome: 'Welcome',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    lockKiosk: 'Lock',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    confirm: 'Confirm',
    done: 'Done',
  },
  es: {
    tapToCheckIn: '🔥 TOCA PARA REGISTRARTE 🔥',
    newStudent: 'Nuevo Estudiante',
    bookFreeTrial: 'Reservar Clase de Prueba',
    enrollNow: 'Inscríbete Ahora',
    buyDayPass: 'Comprar Pase de Día',
    playArcadeGames: 'Jugar Arcade',
    walkInsWelcome: 'Sin Cita Previa',
    startToday: 'Empieza Hoy',
    noCommitment: 'Sin Compromiso',
    classSchedule: 'Horario de Clases',
    attendanceLeaderboard: 'Tabla de Asistencia',
    beltPromotion: 'Promoción de Cinturón',
    checkIn: 'Registrarse',
    searchName: 'Buscar por nombre...',
    welcome: 'Bienvenido',
    goodMorning: 'Buenos Días',
    goodAfternoon: 'Buenas Tardes',
    goodEvening: 'Buenas Noches',
    lockKiosk: 'Bloquear',
    cancel: 'Cancelar',
    back: 'Atrás',
    next: 'Siguiente',
    confirm: 'Confirmar',
    done: 'Listo',
  },
} as const;

export type KioskTranslationKey = keyof typeof KIOSK_TRANSLATIONS['en'];

export function t(lang: KioskLang, key: KioskTranslationKey): string {
  return KIOSK_TRANSLATIONS[lang]?.[key] ?? KIOSK_TRANSLATIONS['en'][key];
}

export const LANG_LABELS: Record<KioskLang, string> = {
  en: '🇺🇸 English',
  es: '🇲🇽 Español',
};
