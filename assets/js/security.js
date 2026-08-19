(function () {
  'use strict';

  window.escapeHTML = function (value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  window.safeText = function (element, value) {
    if (element) element.textContent = String(value ?? '');
  };

  const LOWERCASE_PREPOSITIONS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'd\'', 'del', 'du', 'von', 'van']);
  window.formatarNomeProprio = function (rawName) {
    if (!rawName) return '';
    const cleaned = String(rawName).trim().replace(/\s+/g, ' ');
    if (!cleaned) return '';

    return cleaned
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (!word) return '';
        if (index > 0 && LOWERCASE_PREPOSITIONS.has(word)) return word;
        if (word.includes('-')) {
          return word.split('-').map((p, i) => (i > 0 && LOWERCASE_PREPOSITIONS.has(p)) ? p : (p.charAt(0).toUpperCase() + p.slice(1))).join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };
})();
