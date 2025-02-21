import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";

// ✅ Function to send text to the AI GPT API
export const sendToAI = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/gpt`, { text });
        return response.data;
    } catch (error) {
        console.error("Error communicating with Vader AI backend:", error);
        return { error: "Failed to get response from AI." };
    }
};

// ✅ Function to transcribe speech (Speech-to-Text API)
export const transcribeSpeech = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        const response = await axios.post(`${API_URL}/stt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error("Error transcribing speech:", error);
        return { error: "Failed to transcribe speech." };
    }
};

// ✅ Function to convert text to speech (Text-to-Speech API)
export const getTTS = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/tts`, { text }, {
            responseType: 'blob' // Expecting an audio file in response
        });
        return response.data;
    } catch (error) {
        console.error("Error generating speech from text:", error);
        return null;
    }
};

// ✅ Function to detect wakeword
export const detectWakeword = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    try {
        const response = await axios.post(`${API_URL}/wakeword`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error("Error detecting wakeword:", error);
        return { error: "Failed to process wakeword detection." };
    }
};