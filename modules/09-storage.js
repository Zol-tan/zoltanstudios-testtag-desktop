// ======================================================================
// 09-storage.js
// localStorage keys and job persistence
// ======================================================================

const STORAGE_KEY = "zoltanstudios-testtag-jobs-v1";
const CERT_REGISTRY_KEY = "zoltanstudios-cert-registry-v1";

// ---------------------------------------------------------------------------
// Server sync - push jobs to the ZoltanStudios admin panel (MySQL backend).
// Config (server URL + API token) is stored locally. The token is generated
// in the admin panel under Test & Tag > Desktop App Tokens.
// ---------------------------------------------------------------------------
const SERVER_CONFIG_KEY = "zoltanstudios-server-config-v1";

// When the app is served from the website it is "hosted": the server is the
// storage, it authenticates with the admin session (works on a phone), and
// all local-folder features are hidden. Opened from a file:// copy on the PC
// it stays in offline mode: local folder + token push when internet returns.
