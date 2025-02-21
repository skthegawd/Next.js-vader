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
                        <button onClick={handleBluetoothConnect}>Connect Bluetooth</button>
                        {connectionStatus && <p>{connectionStatus}</p>}
                    </li>
                )}
            </ul>
        </div>
    );
}