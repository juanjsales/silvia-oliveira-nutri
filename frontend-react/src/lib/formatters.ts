const LOWERCASE_PREPOSITIONS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'd\'', 'del', 'du', 'von', 'van'
]);

/**
 * Converte um nome próprio para Capital Case respeitando regras da língua portuguesa
 * Exemplo: "maria da silva santos" -> "Maria da Silva Santos"
 */
export function capitalizePersonName(rawName?: string | null): string {
  if (!rawName) return '';
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (!word) return '';
      // Preposições no meio do nome ficam em minúsculo (ex: Silva de Souza)
      if (index > 0 && LOWERCASE_PREPOSITIONS.has(word)) {
        return word;
      }
      // Trata nomes compostos com hífen (ex: Maria-Helena)
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part, partIdx) => {
            if (partIdx > 0 && LOWERCASE_PREPOSITIONS.has(part)) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Calcula o horário de término a partir do horário de início (HH:MM) e da duração em minutos.
 * Exemplo: ("14:00", 60) -> "15:00"
 */
export function getEndTime(startTime?: string | null, durationMinutes: number = 60): string {
  if (!startTime) return '';
  const s = String(startTime).trim();
  const timePart = s.includes('T') ? s.split('T')[1] || '' : s;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h) || isNaN(m)) return s.slice(0, 5);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor((total % (24 * 60)) / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Formata o intervalo completo da consulta.
 * Exemplo: ("14:00", 60) -> "14:00 às 15:00 (60 min)"
 */
export function formatAppointmentSchedule(startTime?: string | null, durationMinutes: number = 60): string {
  if (!startTime) return `${durationMinutes} min`;
  const cleanStart = String(startTime).slice(0, 5);
  const end = getEndTime(cleanStart, durationMinutes);
  return `${cleanStart} às ${end} (${durationMinutes} min)`;
}
