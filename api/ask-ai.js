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

  const API_KEY = process.env.CLAUDE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API Key is missing" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: prompt
          }]
        })
      }
    );

    const json = await response.json();

    // معالجة الأخطاء من Claude
    if (json.error) {
      return res.status(500).json({ 
        error: "Claude API Error", 
        details: json.error.message || json.error
      });
    }

    // استخراج النص
    if (json.content && json.content[0]?.text) {
      const resultText = json.content[0].text;
      return res.status(200).json({ result: resultText });
    }

    // إذا لم يكن هناك نتيجة واضحة
    return res.status(500).json({ 
      error: "Invalid response structure from Claude", 
      details: JSON.stringify(json)
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}
