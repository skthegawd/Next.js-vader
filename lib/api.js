import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";

// Function to send text to AI GPT API
export const sendToAI = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/gpt`, { text });
        if (response.data && response.data.reply) {
            return response.data;
        } else {
            throw new Error("Invalid AI response format.");
        }
    } catch (error) {
        console.error("Error communicating with Vader AI backend:", error);
        return { error: "Failed to communicate with Vader AI." };
    }
};

// Function to generate TTS (Text-to-Speech) audio
export const getTTS = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/tts`, { text });
        if (response.data && response.data.audio_url) {
            return response.data.audio_url;
        } else {
            throw new Error("Invalid TTS response format.");
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        return { error: "TTS conversion failed." };
    }
};

// Function to transcribe speech-to-text (STT)
export const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        const response = await axios.post(`${API_URL}/stt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.transcription) {
            return response.data.transcription;
        } else {
            throw new Error("Invalid STT response format.");
        }
    } catch (error) {
        console.error("Error transcribing speech:", error);
        return { error: "STT transcription failed." };
    }
};

// Function to detect wakeword (e.g., "Vader")
export const detectWakeword = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        const response = await axios.post(`${API_URL}/wakeword`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data && response.data.detected) {
            return response.data.detected;
        } else {
            throw new Error("Invalid wakeword response format.");
        }
    } catch (error) {
        console.error("Error detecting wakeword:", error);
        return { error: "Wakeword detection failed." };
    }
};
