import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vader-yp5n.onrender.com/api/ai";

export const sendToAI = async (text) => {
    try {
        const response = await axios.post(`${API_URL}`, { text });
        return response.data;
    } catch (error) {
        console.error("Error communicating with Vader AI backend:", error);
        return { error: "Failed to get response from AI." };
    }
};
