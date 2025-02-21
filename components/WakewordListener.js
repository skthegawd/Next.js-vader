import { useEffect, useState } from 'react';
import { detectWakeword } from '../lib/api';

export default function WakewordListener({ onWakewordDetected }) {
    const [listening, setListening] = useState(false);
    let mediaRecorder;
    let audioChunks = [];

    useEffect(() => {
        startListening();
    }, []);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const detected = await detectWakeword(audioBlob);
                if (detected.wakeword_detected) {
                    console.log("🔊 Wakeword Detected!");
                    if (onWakewordDetected) onWakewordDetected();
                }
                audioChunks = [];
            };

            mediaRecorder.start();
            setListening(true);

            setInterval(() => {
                mediaRecorder.stop();
                mediaRecorder.start();
            }, 5000); // Send every 5 seconds
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    return (
        <div className="wakeword-container">
            <p>{listening ? "🎤 Listening for 'Lord Vader'..." : "❌ Not Listening"}</p>
        </div>
    );
}