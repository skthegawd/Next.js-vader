import { useEffect, useState } from 'react';
import { detectWakeword } from '../lib/api';

export default function WakewordListener({ onWakewordDetected }) {
    const [listening, setListening] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);

    useEffect(() => {
        startListening();
    }, []);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.fftSize = 512;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            setListening(true);

            const processAudio = async () => {
                analyser.getByteFrequencyData(dataArray);
                const detected = await detectWakeword(dataArray);
                if (detected.wakeword_detected) {
                    console.log("🔴 Wakeword Detected!");
                    setWakewordDetected(true);
                    if (onWakewordDetected) onWakewordDetected();
                    setTimeout(() => setWakewordDetected(false), 2000); // Reset visual feedback after 2s
                }
                requestAnimationFrame(processAudio);
            };

            processAudio();
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    return (
        <div className={wakewordDetected ? "wakeword-container active" : "wakeword-container"}>
            <p>{listening ? "🎤 Listening for 'Lord Vader'..." : "🛑 Not Listening"}</p>
        </div>
    );
}