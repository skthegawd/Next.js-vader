"use client";

import { useEffect, useState } from 'react';
import { detectWakeword } from '../lib/api'; // ✅ Fixed Import Statement

export default function WakewordListener({ onWakewordDetected }) {
    const [listening, setListening] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted components

        const startListening = async () => {
            try {
                console.log("[DEBUG] Initializing Wakeword Detection...");
                setListening(true);

                const detected = await detectWakeword();
                if (detected && isMounted) {
                    console.log("[DEBUG] Wakeword detected!");
                    setWakewordDetected(true);
                    if (onWakewordDetected) onWakewordDetected();
                }
            } catch (err) {
                console.error("[ERROR] Wakeword Detection Failed:", err);
                if (isMounted) setError("Wakeword detection failed. Check microphone permissions.");
            } finally {
                if (isMounted) setListening(false);
            }
        };

        startListening();

        return () => {
            isMounted = false; // Cleanup function to prevent memory leaks
        };
    }, [onWakewordDetected]);

    return (
        <div className={`wakeword-container ${wakewordDetected ? "active" : ""}`}>
            <p>
                {listening ? "🎙️ Listening for 'Lord Vader'..." : "🔴 Not Listening"}
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
