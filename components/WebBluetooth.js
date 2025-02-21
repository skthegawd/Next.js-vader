export const connectToDevice = async () => {
    if (!navigator.bluetooth) {
        console.error("Web Bluetooth is not supported in this browser.");
        return "Bluetooth not supported in this browser.";
    }

    try {
        console.log("Requesting Bluetooth Device...");
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: false,
            filters: [{ services: ['battery_service'] }],
            optionalServices: ['battery_service']
        });

        console.log("Connecting to GATT Server...");
        const server = await device.gatt.connect();

        console.log("Getting Battery Service...");
        const service = await server.getPrimaryService('battery_service');

        console.log("Getting Battery Level Characteristic...");
        const characteristic = await service.getCharacteristic('battery_level');

        console.log("Reading Battery Level...");
        const value = await characteristic.readValue();
        const batteryLevel = value.getUint8(0);

        console.log(`Battery Level: ${batteryLevel}%`);
        return `Connected to ${device.name} | Battery: ${batteryLevel}%`;
    } catch (error) {
        console.error("Bluetooth connection failed:", error);
        return "Bluetooth connection failed. Please try again.";
    }
};