/*
 * VíaSegura Perú - Adaptador de Firebase (capa cliente)
 * ----------------------------------------------------
 * Carga el SDK de Firebase (compat) de forma perezosa SOLO si existe una
 * configuración válida. Si no hay configuración, la app sigue funcionando con
 * el store local de demostración (js/app.js).
 *
 * Cómo activarlo (ver README de integración en el chat):
 *   1. Crea el proyecto en https://console.firebase.google.com
 *   2. Habilita Authentication (Email/Contraseña) y Cloud Firestore.
 *   3. Copia tu configuración web y defínela ANTES de cargar este archivo:
 *        <script>
 *          window.VIA_SEGURA_FIREBASE_CONFIG = {
 *            apiKey: "...", authDomain: "...", projectId: "...",
 *            storageBucket: "...", messagingSenderId: "...", appId: "..."
 *          };
 *        </script>
 *
 * SEGURIDAD: Firestore debe protegerse con reglas por institución (tenant) y
 * rol. El cliente NUNCA es fuente de verdad para autorización.
 */
(function () {
  'use strict';

  var SDK_VERSION = '10.12.2';
  var CDN = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION + '/';
  var SCRIPTS = [
    'firebase-app-compat.js',
    'firebase-auth-compat.js',
    'firebase-firestore-compat.js'
  ];

  var state = {
    ready: false,
    loading: false,
    app: null,
    auth: null,
    db: null
  };

  function isConfigured() {
    var cfg = window.VIA_SEGURA_FIREBASE_CONFIG;
    return !!(cfg && cfg.apiKey && cfg.projectId && cfg.appId);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadSdk() {
    return SCRIPTS.reduce(function (chain, name) {
      return chain.then(function () { return loadScript(CDN + name); });
    }, Promise.resolve());
  }

  function init() {
    if (state.ready) return Promise.resolve(true);
    if (state.loading) return Promise.resolve(false);
    if (!isConfigured()) return Promise.resolve(false);
    state.loading = true;
    return loadSdk()
      .then(function () {
        if (!window.firebase) throw new Error('Firebase no disponible');
        state.app = window.firebase.apps && window.firebase.apps.length
          ? window.firebase.app()
          : window.firebase.initializeApp(window.VIA_SEGURA_FIREBASE_CONFIG);
        state.auth = window.firebase.auth();
        state.db = window.firebase.firestore();
        state.ready = true;
        return true;
      })
      .catch(function (err) {
        console.warn('[ViaSegura][Firebase]', err.message);
        state.loading = false;
        return false;
      });
  }

  function signIn(email, password) {
    if (!state.ready) return Promise.reject(new Error('Firebase no configurado.'));
    return state.auth.signInWithEmailAndPassword(email, password).then(function (cred) {
      return cred.user;
    });
  }

  function signOut() {
    if (!state.ready) return Promise.resolve(true);
    return state.auth.signOut();
  }

  function onAuthStateChanged(cb) {
    if (!state.ready) return function () {};
    return state.auth.onAuthStateChanged(cb);
  }

  function collection(name) {
    if (!state.ready) throw new Error('Firebase no configurado.');
    return state.db.collection(name);
  }

  window.ViaSeguraFirebase = {
    isConfigured: isConfigured,
    isReady: function () { return state.ready; },
    init: init,
    signIn: signIn,
    signOut: signOut,
    onAuthStateChanged: onAuthStateChanged,
    collection: collection
  };
})();
