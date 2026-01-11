#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::OnceLock;
use std::fs::OpenOptions;
use std::panic;

use tracing::info;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::EnvFilter;

static LOG_GUARD: OnceLock<WorkerGuard> = OnceLock::new();

fn init_file_logger() {
    if LOG_GUARD.get().is_some() {
        return;
    }

    let log_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(std::env::temp_dir);

    let _ = std::fs::create_dir_all(&log_dir);

    // Try to ensure we can write next to the executable; fall back to temp if not.
    let writable_dir = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_dir.join("notes-desktop.log"))
        .map(|_| log_dir.clone())
        .unwrap_or_else(|_| std::env::temp_dir());

    let _ = std::fs::create_dir_all(&writable_dir);
    let file_appender = tracing_appender::rolling::never(writable_dir, "notes-desktop.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    let _ = LOG_GUARD.set(guard);
    let _ = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_writer(non_blocking)
        .with_env_filter(EnvFilter::from_default_env())
        .try_init();
}

fn main() {
    init_file_logger();
    info!(version = env!("CARGO_PKG_VERSION"), "Notes Desktop starting");

    panic::set_hook(Box::new(|panic_info| {
        if let Some(location) = panic_info.location() {
            info!(
                target: "panic",
                "panic at {}:{}: {}",
                location.file(),
                location.line(),
                panic_info
            );
        } else {
            info!(target: "panic", "panic: {}", panic_info);
        }
    }));

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
