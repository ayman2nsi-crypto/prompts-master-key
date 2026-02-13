export default async function handler(req, res) {
  // تفعيل CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API Key is missing" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const json = await response.json();

    // معالجة الأخطاء من Google
    if (json.error) {
      return res.status(500).json({ 
        error: "Google API Error", 
        details: json.error.message || json.error
      });
    }

    // استخراج النص
    if (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
      const resultText = json.candidates[0].content.parts[0].text;
      return res.status(200).json({ result: resultText });
    }

    // إذا لم يكن هناك نتيجة واضحة
    return res.status(500).json({ 
      error: "Invalid response structure from Google", 
      details: JSON.stringify(json)
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}
