// Desktop entry point. All the actual setup lives in lib.rs so that the
// iOS shell can call exactly the same code.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    zoltanstudios_testtag_lib::run()
}
