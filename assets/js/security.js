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
})();
