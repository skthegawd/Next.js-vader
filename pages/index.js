import Head from "next/head";
import Sidebar from "../components/Sidebar";
import TerminalUI from "../components/TerminalUI";

export default function Home() {
    return (
        <div className="container">
            <Head>
                <title>Vader AI Assistant</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Sidebar />
            <main className="main">
                <h1>Welcome to the Dark Side</h1>
                <TerminalUI />
            </main>
        </div>
    );
}