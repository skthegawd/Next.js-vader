"use client";

import { useEffect, useState } from 'react';
import { detectWakeword } from '../lib/api';

export default function WakewordListener({ onWakewordDetected }) {
    const [listening, setListening] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const startListening = async () => {
            try {
                console.log("[DEBUG] Initializing Wakeword Detection...");
                setListening(true);
                const detected = await detectWakeword();
                if (detected) {
                    console.log("[DEBUG] Wakeword detected!");
                    setWakewordDetected(true);
                    if (onWakewordDetected) {
                        onWakewordDetected();
                    }
                    // Reset after 2 seconds to avoid multiple detections
                    setTimeout(() => setWakewordDetected(false), 2000);
                }
            } catch (err) {
                console.error("[ERROR] Wakeword Detection Failed:", err);
                setError("Microphone access denied or API error");
            } finally {
                setListening(false);
            }
        };
        startListening();
    }, []);

    return (
        <div className={wakewordDetected ? "wakeword-container active" : "wakeword-container"}>
            <p>
                {listening ? "🎤 Listening for 'Lord Vader'..." : "🚫 Not Listening"}
            </p>
            {error && <p className="error">{error}</p>}
            <style jsx>{`
                .wakeword-container {
                    padding: 10px;
                    text-align: center;
                    background: black;
                    color: #33ff33;
                    font-family: 'Courier New', monospace;
                    border: 2px solid #ff4444;
                    box-shadow: 0 0 10px #ff0000;
                }
                .wakeword-container.active {
                    background: #ff4444;
                    color: black;
                    box-shadow: 0 0 20px #ff4444;
                }
                .error {
                    color: red;
                }
            `}</style>
        </div>
    );
}
