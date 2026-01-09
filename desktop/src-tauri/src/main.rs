#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        // Enable desktop notifications (Tauri v2 plugin)
        .plugin(tauri_plugin_notification::init())
        // Enable auto-updates (Tauri v2 plugin)
        .plugin(tauri_plugin_updater::Builder::new().build())
    // Enable process controls (relaunch)
    .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
