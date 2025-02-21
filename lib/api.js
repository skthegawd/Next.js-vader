import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";

console.log("Using API Base URL:", API_URL);

// Function to send text to AI GPT API
export const sendToAI = async (text) => {
    try {
        console.log("[DEBUG] Sending request to GPT API with text:", text);
        const response = await axios.post(`${API_URL}/gpt`, { text });
        console.log("[DEBUG] GPT API Response:", response.data);
        
        if (response.data && response.data.reply) {
            return response.data;
        } else {
            throw new Error("Invalid AI response format.");
        }
    } catch (error) {
        console.error("[ERROR] GPT API communication failed:", error);
        return { error: "Failed to communicate with Vader AI." };
    }
};

// Function to generate TTS (Text-to-Speech) audio
export const getTTS = async (text) => {
    try {
        console.log("[DEBUG] Sending request to TTS API with text:", text);
        const response = await axios.post(`${API_URL}/tts`, { text });
        console.log("[DEBUG] TTS API Response:", response.data);
        
        if (response.data && response.data.audio_url) {
            return response.data.audio_url;
        } else {
            throw new Error("Invalid TTS response format.");
        }
    } catch (error) {
        console.error("[ERROR] TTS API failed:", error);
        return { error: "TTS conversion failed." };
    }
};

// Function to transcribe speech-to-text (STT)
export const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        console.log("[DEBUG] Sending audio to STT API...");
        const response = await axios.post(`${API_URL}/stt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[DEBUG] STT API Response:", response.data);
        
        if (response.data && response.data.transcription) {
            return response.data.transcription;
        } else {
            throw new Error("Invalid STT response format.");
        }
    } catch (error) {
        console.error("[ERROR] STT API failed:", error);
        return { error: "STT transcription failed." };
    }
};

// Function to detect wakeword (e.g., "Vader")
export const detectWakeword = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        console.log("[DEBUG] Sending audio to Wakeword API...");
        const response = await axios.post(`${API_URL}/wakeword`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[DEBUG] Wakeword API Response:", response.data);
        
        if (response.data && response.data.detected) {
            return response.data.detected;
        } else {
            throw new Error("Invalid wakeword response format.");
        }
    } catch (error) {
        console.error("[ERROR] Wakeword API failed:", error);
        return { error: "Wakeword detection failed." };
    }
};