import { useEffect, useState } from "react";
import { PorcupineWorkerFactory } from "@picovoice/porcupine-web";

const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY;

export const useWakeword = (onWakewordDetected) => {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    let porcupineWorker = null;

    const initWakewordDetection = async () => {
      try {
        porcupineWorker = await PorcupineWorkerFactory.create(
          accessKey,
          [{ publicPath: "/Lord-Vader_en_linux_v3_0_0.ppn", label: "Lord Vader" }],
          (keywordLabel) => {
            if (keywordLabel === "Lord Vader") {
              console.log("🚀 Wakeword Detected: Lord Vader");
              onWakewordDetected(); // Trigger API call
            }
          }
        );

        porcupineWorker.start();
        setListening(true);
      } catch (error) {
        console.error("❌ Error initializing wakeword detection:", error);
      }
    };

    initWakewordDetection();

    return () => {
      if (porcupineWorker) porcupineWorker.terminate();
      setListening(false);
    };
  }, [onWakewordDetected]);

  return listening;
};
