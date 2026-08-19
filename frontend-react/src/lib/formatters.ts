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
