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

// Function to transcribe speech (Speech-to-Text API)
export const transcribeSpeech = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    try {
        const response = await axios.post(`${API_URL}/stt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error transcribing speech:", error);
        return { error: "Speech transcription failed." };
    }
};

// Function to generate TTS audio from text
export const getTTS = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/tts`, { text }, { responseType: 'blob' });
        return response.data;
    } catch (error) {
        console.error("Error generating speech from text:", error);
        return null;
    }
};

// Function to detect wakeword
export const detectWakeword = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    try {
        const response = await axios.post(`${API_URL}/wakeword`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error detecting wakeword:", error);
        return { error: "Wakeword detection failed." };
    }
};