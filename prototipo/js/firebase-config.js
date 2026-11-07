// Configuración de Firebase (editar con tus credenciales)
// Si no configuras esto, el sistema usará localStorage como fallback
window.VIASEGURA_FIREBASE_CONFIG = {
  // apiKey: "TU_API_KEY",
  // authDomain: "TU_PROYECTO.firebaseapp.com",
  // projectId: "TU_PROYECTO",
  // storageBucket: "TU_PROYECTO.appspot.com",
  // messagingSenderId: "TU_SENDER_ID",
  // appId: "TU_APP_ID"
};

window.ViaSeguraFirebase = (function(){
  const cfg = window.VIASEGURA_FIREBASE_CONFIG || {};
  if(!cfg.apiKey) return { isReady: function(){ return false; } };
  try {
    if(!firebase.apps.length) firebase.initializeApp(cfg);
    const auth = firebase.auth();
    const db = firebase.firestore();
    return {
      isReady: function(){ return true; },
      auth: auth,
      db: db,
      signIn: function(email,pass){ return auth.signInWithEmailAndPassword(email,pass); },
      signOut: function(){ return auth.signOut(); },
      collection: function(name){ return db.collection(name); }
    };
  } catch(e) {
    return { isReady: function(){ return false; } };
  }
})();
