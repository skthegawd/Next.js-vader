import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { sendToAI } from '../lib/api';

export default function VoiceAssistant() {
    const [response, setResponse] = useState('');
    const { transcript, listening, resetTranscript } = useSpeechRecognition();

    useEffect(() => {
        if (!listening && transcript) {
            sendToAI(transcript).then((data) => setResponse(data.reply));
            resetTranscript();
        }
    }, [listening]);

    return (
        <div className="voice-container">
            <button onClick={SpeechRecognition.startListening}>🎙 Start Listening</button>
            <p>🗣 {transcript}</p>
            <p>🤖 {response}</p>
        </div>
    );
}
