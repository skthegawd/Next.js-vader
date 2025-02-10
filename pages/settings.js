import Head from 'next/head';
import Sidebar from '../components/Sidebar';

export default function Settings() {
    return (
        <div className="settings-container">
            <Head>
                <title>Vader AI Settings</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Sidebar />
            <main className="settings-main">
                <h1>Settings</h1>
                <p>Adjust AI behavior, voice settings, and IoT device preferences.</p>
            </main>
        </div>
    );
}
