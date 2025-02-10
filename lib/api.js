import axios from 'axios';

export const sendToAI = async (text) => {
    const response = await axios.post("https://your-fastapi-backend.com/api/ai", { text });
    return response.data;
};
