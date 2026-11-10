// Runs synchronously in <head> before the first paint. It mirrors the saved
// theme mode onto <html> so the boot shell, and later the React app, open in
// the right colours without a flash.
(function () {
  var KEY = 'xfit-theme';
  var saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch (error) {
    /* private mode */
  }
  var mode = saved === 'midnight' || saved === 'sunrise' ? saved : 'auto';
  var hour = new Date().getHours();
  var resolved = mode === 'auto' ? (hour >= 6 && hour < 19 ? 'sunrise' : 'midnight') : mode;
  var root = document.documentElement;
  root.classList.remove('theme-midnight', 'theme-sunrise');
  root.classList.add('theme-' + resolved);
  root.setAttribute('data-theme', resolved);
  root.setAttribute('data-theme-mode', mode);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'sunrise' ? '#fbf6ef' : '#20212d');
})();
