export default async function handler(req, res) {
  // 1. التحقق من طريقة الطلب
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 2. جلب المفتاح
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API Key is missing" });
  }

  try {
    // 3. قراءة الرسالة من الموقع
    const { prompt } = req.body;

    // 4. إرسال الطلب لجوجل مباشرة
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

    // 5. استخراج النص من رد جوجل
    if (json.candidates && json.candidates[0]?.content) {
      const resultText = json.candidates[0].content.parts[0].text;
      return res.status(200).json({ result: resultText });
    } else {
      return res.status(500).json({ 
        error: "Invalid response from Google", 
        details: json 
      });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
