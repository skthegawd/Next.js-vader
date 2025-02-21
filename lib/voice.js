import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";

// Function to generate Text-to-Speech (TTS) audio
export const tts_api_tts = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/tts`, { text });
        if (response.data && response.data.audio_url) {
            const audio = new Audio(response.data.audio_url);
            audio.play();
            return response.data.audio_url;
        } else {
            throw new Error("Invalid TTS response format.");
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// Function to transcribe Speech-to-Text (STT)
export const stt_api_stt = async (audioBlob) => {
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
        return null;
    }
};

// Function to detect Wakeword (e.g., "Vader")
export const wakeword_api_wakeword = async (audioBlob) => {
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
        return false;
    }
};
