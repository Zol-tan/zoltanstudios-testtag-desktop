// ZoltanStudios Test and Tag — shared app setup.
//
// Both the desktop binary (main.rs) and the iOS shell call run() from here.
//
// The window is defined in tauri.conf.json, including the URL it loads.
// Creating it here as well produced two windows labelled "main", which
// panics at startup (Windows exception 0xc0000409).
//
// The app is a native shell around the hosted web app. Loading the live site
// rather than bundling a copy means the PHP session cookie works exactly as
// it does in a browser, and uploading new files to cPanel updates every
// platform at once with no rebuild.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running the ZoltanStudios Test and Tag application");
}
