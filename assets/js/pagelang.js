(function () {
  function pick() {
    var l = null;
    try { l = localStorage.getItem('lang'); } catch (e) {}
    if (l === 'fr' || l === 'en') return l;
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  function set(lang) {
    if (lang !== 'fr' && lang !== 'en') return;
    document.documentElement.lang = lang;
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }

  var style = document.createElement('style');
  style.textContent =
    '[data-lang]{display:none}' +
    'html[lang="fr"] [data-lang="fr"],html[lang="en"] [data-lang="en"]{display:revert}';
  (document.head || document.documentElement).appendChild(style);

  document.documentElement.lang = pick();

  // Language switch
  window.addEventListener('storage', function (e) {
    if (e.key === 'lang' && (e.newValue === 'fr' || e.newValue === 'en')) {
      document.documentElement.lang = e.newValue;
    }
  });

  window.PageLang = { get: pick, set: set };
})();
