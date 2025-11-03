use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::collections::HashMap;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use time::OffsetDateTime;
use dotenvy::dotenv;
use tokio;
use tokio::net::TcpListener;
use std::sync::Arc;

// Import the WebRTC signaling module
mod webrtc_signaling;
use webrtc_signaling::{websocket_handler, RoomMap};

// Data structures
#[derive(Serialize, Deserialize, Debug)]
struct EventIngest {
    ts: String,
    object_class: String,
    object_count: Option<i32>,
    confidence: f64,
    latitude: f64,
    longitude: f64,
    source: String,
    source_ref: String,
    bbox: Option<serde_json::Value>,
    meta: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct SummaryResponse {
    total_24h: i64,
    avg_conf: f64,
    top_fod: Option<String>,
}

// Data structure for AI detection response
#[derive(Serialize, Deserialize, Debug)]
struct Detection {
    cls: String,
    conf: f64,
    bbox_xywh: Vec<f64>,
}

#[derive(Serialize, Deserialize, Debug)]
struct DetectionResponse {
    ts: String,
    model: String,
    fps: f64,
    detections: Vec<Detection>,
}

// Application state
#[derive(Clone)]
struct AppState {
    db_pool: PgPool,
    ai_client: reqwest::Client,
    ai_base_url: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Get environment variables
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let ai_base_url = std::env::var("AI_BASE_URL")
        .expect("AI_BASE_URL must be set");
    
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse()
        .expect("PORT must be a valid number");
    
    // Create database connection pool
    let pool = PgPool::connect(&database_url).await?;
    
    // Create reqwest client
    let client = reqwest::Client::new();
    
    // Create application state
    let app_state = AppState {
        db_pool: pool,
        ai_client: client,
        ai_base_url,
    };
    
    // Create the rooms map for WebRTC signaling
    let rooms: RoomMap = Arc::new(DashMap::new());
    
    // Build the application with routes
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/events/ingest", post(events_ingest_handler))
        .route("/dashboard/summary", get(dashboard_summary_handler))
        .route("/ws/signaling/:room_id", get(websocket_handler))
        .route("/proxy/detect", post(proxy_detect_handler))
        .layer(axum::extract::Extension(rooms))
        .with_state(app_state)
        .layer(CorsLayer::permissive());
    
    // Run the server
    let listener = TcpListener::bind(&format!("0.0.0.0:{}", port)).await?;
    println!("Backend server listening on 0.0.0.0:{}", port);
    
    axum::serve(listener, app).await?;
    
    Ok(())
}

// Health check endpoint
async fn health_handler() -> &'static str {
    "OK"
}

// Event ingestion endpoint
async fn events_ingest_handler(
    State(state): State<AppState>,
    Json(payload): Json<EventIngest>,
) -> Result<Json<HashMap<String, String>>, StatusCode> {
    // First, try to get the class_id from fod_classes table, or insert if not exists
    let class_id_query = r#"
        INSERT INTO fod_classes (name) 
        VALUES ($1) 
        ON CONFLICT (name) 
        DO UPDATE SET name = EXCLUDED.name 
        RETURNING id
    "#;
    
    let class_row = sqlx::query(class_id_query)
        .bind(&payload.object_class)
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| {
            eprintln!("Error getting/creating class: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    let class_id: i32 = class_row.get(0);
    
    // Insert the event into the events table
    let query = r#"
        INSERT INTO events (
            ts, class_id, object_count, confidence, 
            latitude, longitude, source, source_ref, 
            bbox, meta
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    "#;
    
    let event_count = payload.object_count.unwrap_or(1);
    
    let row = sqlx::query(query)
        .bind(&payload.ts)
        .bind(class_id)
        .bind(event_count)
        .bind(payload.confidence)
        .bind(payload.latitude)
        .bind(payload.longitude)
        .bind(&payload.source)
        .bind(&payload.source_ref)
        .bind(&payload.bbox)
        .bind(&payload.meta)
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| {
            eprintln!("Database error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let event_id: Uuid = row.get(0);
    let mut response = HashMap::new();
    response.insert("success".to_string(), "true".to_string());
    response.insert("eventId".to_string(), event_id.to_string());
    Ok(Json(response))
}

// Dashboard summary endpoint
async fn dashboard_summary_handler(
    State(state): State<AppState>,
) -> Result<Json<SummaryResponse>, StatusCode> {
    // Get count of events in last 24 hours
    let total_24h_query = r#"
        SELECT COUNT(*) as total 
        FROM events 
        WHERE ts >= NOW() - INTERVAL '24 hours'
    "#;
    
    // Get average confidence of events in last 24 hours
    let avg_conf_query = r#"
        SELECT COALESCE(AVG(confidence), 0) as avg_conf 
        FROM events 
        WHERE ts >= NOW() - INTERVAL '24 hours'
    "#;
    
    // Get top FOD class in last 24 hours
    let top_fod_query = r#"
        SELECT fc.name, COUNT(e.id) as count
        FROM events e
        JOIN fod_classes fc ON e.class_id = fc.id
        WHERE e.ts >= NOW() - INTERVAL '24 hours'
        GROUP BY fc.name
        ORDER BY count DESC
        LIMIT 1
    "#;
    
    // Execute queries
    let total_24h_result = sqlx::query_one(total_24h_query)
        .fetch(&state.db_pool)
        .await
        .map_err(|e| {
            eprintln!("Error getting total 24h: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    let avg_conf_result = sqlx::query_one(avg_conf_query)
        .fetch(&state.db_pool)
        .await
        .map_err(|e| {
            eprintln!("Error getting avg conf: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    let top_fod_result = sqlx::query_opt(top_fod_query)
        .fetch_optional(&state.db_pool)
        .await
        .map_err(|e| {
            eprintln!("Error getting top fod: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    let total_24h: i64 = total_24h_result.try_get("total")
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let avg_conf: f64 = avg_conf_result.try_get("avg_conf")
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let top_fod: Option<String> = top_fod_result.map(|r| r.try_get("name").unwrap_or_default());
    
    Ok(Json(SummaryResponse {
        total_24h,
        avg_conf,
        top_fod,
    }))
}

// Proxy detection endpoint - forwards to AI service
async fn proxy_detect_handler(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Extract the file from multipart
    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("file").to_string();
        if name == "file" {
            filename = Some(field.file_name().unwrap_or("image.jpg").to_string());
            file_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec());
            break; // Only process the first file field
        }
    }
    
    let file_data = file_data.ok_or(StatusCode::BAD_REQUEST)?;
    
    // Create a multipart form to send to the AI service
    let form = reqwest::multipart::Form::new()
        .part("file", reqwest::multipart::Part::bytes(file_data).file_name(filename.unwrap_or("image.jpg".to_string())));
    
    // Forward the request to the AI service
    let ai_response = state
        .ai_client
        .post(format!("{}/v1/detect", state.ai_base_url))
        .multipart(form)
        .send()
        .await
        .map_err(|e| {
            eprintln!("Error forwarding to AI service: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    // Get the response from the AI service
    let ai_response_text = ai_response
        .text()
        .await
        .map_err(|e| {
            eprintln!("Error reading AI response: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    // Parse and return the JSON response
    let ai_response_json: serde_json::Value = serde_json::from_str(&ai_response_text)
        .map_err(|e| {
            eprintln!("Error parsing AI response JSON: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    Ok(Json(ai_response_json))
}