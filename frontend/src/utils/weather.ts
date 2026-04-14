export function weatherEmoji(code: number | null): string {
  if (code === null) return '🌤️';
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export function tempColor(temp: number | null): string {
  if (temp === null) return '#90cdf4';
  if (temp <= 0) return '#bee3f8';
  if (temp <= 10) return '#90cdf4';
  if (temp <= 18) return '#63b3ed';
  if (temp <= 25) return '#68d391';
  if (temp <= 32) return '#f6e05e';
  if (temp <= 38) return '#f6ad55';
  return '#fc8181';
}

export function precipColor(mm: number | null): string {
  if (!mm || mm < 0.5) return 'rgba(144,205,244,0.1)';
  if (mm < 2) return 'rgba(99,179,237,0.4)';
  if (mm < 10) return 'rgba(49,130,206,0.6)';
  if (mm < 20) return 'rgba(44,82,130,0.8)';
  if (mm < 50) return 'rgba(26,54,93,0.9)';
  return 'rgba(116,42,42,0.9)';
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'extreme': return '#fc8181';
    case 'warning': return '#f6ad55';
    case 'watch': return '#faf089';
    default: return '#68d391';
  }
}

export function alertSeverityColor(severity: string): { bg: string; border: string; text: string } {
  switch (severity) {
    case 'red': return { bg: 'rgba(197,48,48,0.15)', border: '#fc8181', text: '#fc8181' };
    case 'orange': return { bg: 'rgba(221,107,32,0.15)', border: '#f6ad55', text: '#f6ad55' };
    case 'yellow': return { bg: 'rgba(236,201,75,0.15)', border: '#faf089', text: '#faf089' };
    default: return { bg: 'rgba(56,161,105,0.15)', border: '#68d391', text: '#68d391' };
  }
}

export function windDirection(deg: number | null): string {
  if (deg === null) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NP', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kathmandu' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });
}

export function nepaliDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ne-NP', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'long', day: 'numeric' });
}

export function alertTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    thunder: '⚡', rain: '🌧️', flood: '🌊', snow: '❄️',
    hail: '🌨️', heatwave: '🌡️', fog: '🌫️', cold: '🥶', wind: '💨',
  };
  return icons[type] || '⚠️';
}

export function getSeasonalContext(): { season: string; emoji: string; np: string } {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 9) return { season: 'Monsoon Season', emoji: '🌧️', np: 'वर्षा ऋतु' };
  if (month >= 10 && month <= 11) return { season: 'Post-Monsoon', emoji: '🍂', np: 'शरद ऋतु' };
  if (month >= 12 || month <= 2) return { season: 'Winter', emoji: '❄️', np: 'हिउँद' };
  if (month >= 3 && month <= 5) return { season: 'Pre-Monsoon', emoji: '🌤️', np: 'वसन्त ऋतु' };
  return { season: 'Spring', emoji: '🌸', np: 'वसन्त' };
}
