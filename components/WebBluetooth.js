export const connectToDevice = async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service'],
        });

        const server = await device.gatt.connect();
        console.log('Connected to', device.name);
    } catch (error) {
        console.error('Bluetooth connection failed:', error);
    }
};
