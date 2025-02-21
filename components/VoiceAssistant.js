import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { sendToAI } from '../lib/api';

export default function VoiceAssistant({ onTranscribe }) {
    const { transcript, listening, resetTranscript } = useSpeechRecognition();
    const [response, setResponse] = useState('');

    useEffect(() => {
        if (!listening && transcript) {
            handleTranscription(transcript);
        }
    }, [listening, transcript]);

    const handleTranscription = async (text) => {
        if (!text.trim()) return;
        if (onTranscribe) onTranscribe(text);
        try {
            const data = await sendToAI(text);
            setResponse(data.reply);
            speakResponse(data.reply);
        } catch (error) {
            console.error('Error communicating with AI:', error);
        }
        resetTranscript();
    };

    const speakResponse = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="voice-container">
            <button onClick={SpeechRecognition.startListening} disabled={listening}>
                🎤 {listening ? 'Listening...' : 'Start Voice Command'}
            </button>
            <p>🗣 {transcript}</p>
            <p>🤖 {response}</p>
        </div>
    );
}