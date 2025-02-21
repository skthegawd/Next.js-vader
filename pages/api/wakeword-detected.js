export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/wakeword", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to notify backend");
    }

    return res.status(200).json({ message: "Wakeword detected and API notified" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
}