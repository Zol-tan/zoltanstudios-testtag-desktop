// ZoltanStudios Test & Tag — desktop wrapper.
//
// This is a thin native shell around the hosted web app. Loading the live
// site (rather than bundling a copy) means:
//   - the PHP session cookie works exactly as it does in the browser, so
//     login and server sync behave identically
//   - uploading new app files to cPanel updates the desktop app too, with
//     no rebuild or reinstall
//
// The service worker still caches the app after the first successful load,
// so it keeps working on site with no signal.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

const APP_URL: &str = "https://zoltanstudios.au/testtag-app.html";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            use tauri::{WebviewUrl, WebviewWindowBuilder};

            let url = APP_URL
                .parse()
                .expect("APP_URL should be a valid absolute URL");

            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("ZoltanStudios Test & Tag Records")
                .inner_size(1400.0, 900.0)
                .min_inner_size(900.0, 600.0)
                .center()
                .resizable(true)
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the ZoltanStudios Test & Tag application");
}
