use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path,
    },
    response::Response,
};
use dashmap::DashMap;
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

// Data structures for signaling
#[derive(Deserialize, Serialize, Debug)]
pub struct SignalingMessage {
    pub from: String,
    pub payload: SignalingPayload,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum SignalingPayload {
    Offer { sdp: String },
    Answer { sdp: String },
    Candidate { candidate: String, sdp_mid: Option<String>, sdp_m_line_index: Option<u32> },
}

pub type PeerSender = mpsc::UnboundedSender<Message>;
pub type RoomMap = Arc<DashMap<String, DashMap<String, PeerSender>>>;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    rooms: RoomMap,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, room_id, rooms))
}

async fn handle_socket(socket: WebSocket, room_id: String, rooms: RoomMap) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel();
    
    // Add this peer to the room
    let peer_id = Uuid::new_v4().to_string();
    rooms
        .entry(room_id.clone())
        .or_insert_with(DashMap::new)
        .insert(peer_id.clone(), tx);

    // Start sending messages to the client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Handle receiving messages from the client
    let peer_id_clone = peer_id.clone();
    let room_id_clone = room_id.clone();
    let rooms_clone = rooms.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            // Handle different message types
            match msg {
                Message::Text(msg_text) => {
                    // Parse the message to determine how to handle it
                    if let Ok(signaling_msg) = serde_json::from_str::<SignalingPayload>(&msg_text) {
                        // Create the wrapped message
                        let wrapped_msg = SignalingMessage {
                            from: peer_id_clone.clone(),
                            payload: signaling_msg,
                        };
                        
                        let msg_json = match serde_json::to_string(&wrapped_msg) {
                            Ok(json) => json,
                            Err(_) => continue,
                        };
                        
                        // Send to all other peers in the room
                        if let Some(room) = rooms_clone.get(&room_id_clone) {
                            for peer in room.iter() {
                                if peer.key() != &peer_id_clone {
                                    let _ = peer.send(Message::Text(msg_json.clone()));
                                }
                            }
                        }
                    }
                },
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    // Cleanup: remove the peer from the room
    if let Some(room) = rooms.get(&room_id) {
        room.remove(&peer_id);
        if room.is_empty() {
            rooms.remove(&room_id);
        }
    }
}