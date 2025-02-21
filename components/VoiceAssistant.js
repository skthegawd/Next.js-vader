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
            setResponse('[Error] Communication failed. Try again.');
        }
        resetTranscript();
    };

    const speakResponse = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="voice-container">
            <button onClick={SpeechRecognition.startListening} disabled={listening} className="voice-button">
                🎤 {listening ? 'Listening...' : 'Start Voice Command'}
            </button>
            <p className="voice-transcript">🗣 {transcript}</p>
            <p className="voice-response">🤖 {response}</p>
            <style jsx>{`
                .voice-container {
                    text-align: center;
                    padding: 20px;
                    background: black;
                    color: #ff4444;
                    font-family: 'Star Jedi', sans-serif;
                }
                .voice-button {
                    background: black;
                    color: #ff4444;
                    border: 2px solid #ff4444;
                    padding: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .voice-button:hover {
                    background: #ff4444;
                    color: black;
                    box-shadow: 0 0 10px #ff4444;
                }
                .voice-transcript, .voice-response {
                    font-size: 18px;
                    margin-top: 10px;
                    text-shadow: 0 0 5px red;
                }
            `}</style>
        </div>
    );
}