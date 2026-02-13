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

  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API Key is missing" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: prompt
          }],
          max_tokens: 4096
        })
      }
    );

    const json = await response.json();

    // معالجة الأخطاء من OpenAI
    if (json.error) {
      return res.status(500).json({ 
        error: "OpenAI API Error", 
        details: json.error.message || json.error
      });
    }

    // استخراج النص
    if (json.choices && json.choices[0]?.message?.content) {
      const resultText = json.choices[0].message.content;
      return res.status(200).json({ result: resultText });
    }

    // إذا لم يكن هناك نتيجة واضحة
    return res.status(500).json({ 
      error: "Invalid response structure from OpenAI", 
      details: JSON.stringify(json)
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}
