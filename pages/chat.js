import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import styles from '../styles/chat.css';

export default function Chat() {
    return (
        <div className="chat-container">
            <Head>
                <title>Vader AI Chat</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Sidebar />
            <main className="chat-main">
                <h1>AI Chat Interface</h1>
                <VoiceAssistant />
            </main>
        </div>
    );
}
