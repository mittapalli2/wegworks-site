/* WegWorks Developers page — copy script to clipboard */
(function() {
  'use strict';

  window.copyScript = function(type) {
    var scriptId = type === 'ps1' ? 'ps1-script' : 'bash-script';
    var scriptElement = document.getElementById(scriptId);
    if (!scriptElement) return;

    var text = scriptElement.innerText;

    navigator.clipboard.writeText(text).then(function() {
      var btn = event.target.closest('.copy-btn');
      if (!btn) return;

      btn.classList.add('copied');
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';

      setTimeout(function() {
        btn.classList.remove('copied');
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
      }, 2000);
    });
  };
})();
