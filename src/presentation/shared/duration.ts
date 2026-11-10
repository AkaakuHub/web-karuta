export function formatDuration(milliseconds: number) {
  const total = Math.floor(milliseconds / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor((milliseconds % 60000) / 100) / 10;
  return `${hours ? `${hours}時間` : ''}${minutes ? `${minutes}分` : ''}${seconds}秒`;
}

export function formatClock(seconds: number, minuteDigits: number) {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(minuteDigits, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
