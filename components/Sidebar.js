import { useState, useEffect } from 'react';
import { connectToDevice } from './WebBluetooth';

export default function Sidebar() {
    const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('');

    useEffect(() => {
        if (navigator.bluetooth) {
            setBluetoothAvailable(true);
        }
    }, []);

    const handleBluetoothConnect = async () => {
        const status = await connectToDevice();
        setConnectionStatus(status);
    };

    return (
        <div className="sidebar">
            <h2>Vader AI Menu</h2>
            <ul>
                <li><a href="/chat">Chat</a></li>
                <li><a href="/terminal">Terminal</a></li>
                {bluetoothAvailable && (
                    <li>
                        <button onClick={handleBluetoothConnect} className="bluetooth-btn">
                            Connect Bluetooth
                        </button>
                        {connectionStatus && <p className="status-message">{connectionStatus}</p>}
                    </li>
                )}
            </ul>
            <style jsx>{`
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background: #111;
                    color: #ff4444;
                    font-family: 'Star Jedi', sans-serif;
                    padding: 20px;
                    box-shadow: 2px 0px 10px rgba(255, 0, 0, 0.5);
                }
                .bluetooth-btn {
                    background: black;
                    color: #ff4444;
                    border: 2px solid #ff4444;
                    padding: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .bluetooth-btn:hover {
                    background: #ff4444;
                    color: black;
                    box-shadow: 0 0 10px #ff4444;
                }
                .status-message {
                    margin-top: 10px;
                    font-size: 14px;
                    color: #ff4444;
                }
            `}</style>
        </div>
    );
}