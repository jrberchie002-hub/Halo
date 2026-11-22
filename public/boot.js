/* Halo boot: runs the normal app.js, unless the emergency channel is on (Vercel deploy limit hit).
   Emergency bundle lives on the Halo Music site. If it fails or crashes, we fall back to app.js. */
(function () {
  var em = null, bad = '';
  try { em = JSON.parse(localStorage.getItem('halo.em') || 'null'); bad = localStorage.getItem('halo.embad') || ''; } catch (e) {}
  var use = em && em.on && em.js && /^https:\/\/halo-music\.vercel\.app\//.test(em.js) && em.code && bad !== em.code;
  var src = use ? em.js + '?c=' + encodeURIComponent(em.code) : '/app.js';
  if (use) {
    window.HALO_EM = em.code; var t0 = Date.now();
    var fail = function () { try { localStorage.setItem('halo.embad', em.code); } catch (e) {} location.reload(); };
    window.addEventListener('error', function (e) { if (Date.now() - t0 < 5000 && !window.HALO_UP) fail(); });
    if (em.css && /^https:\/\/halo-music\.vercel\.app\//.test(em.css)) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = em.css + '?c=' + encodeURIComponent(em.code); document.head.appendChild(l); }
    document.write('<script src="' + src + '" onerror="try{localStorage.setItem(\'halo.embad\',\'' + em.code + '\')}catch(e){}location.reload()"><\/script>');
  } else document.write('<script src="' + src + '"><\/script>');
})();
