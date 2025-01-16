use tauri_plugin_fs;
use tauri_plugin_shell;
use tauri_plugin_store;
use tauri_plugin_http;


#[cfg_attr(mobile, tauri::mobile_entry_point)] 
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init()) // Add the FS plugin
        .plugin(tauri_plugin_fs::init()) // Add the FS plugin
        .plugin(tauri_plugin_shell::init()) // Add the Shell plugin
        .plugin(tauri_plugin_store::Builder::default().build()) // Add the Shell plugin
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
