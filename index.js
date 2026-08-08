app.post('/api/chat', async (req, res) => {
  try {
    const { userMessage } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-1b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are an English teacher for Somali students. Translate the input to Somali, explain any grammar points, and reply in clear Somali."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const aiReply = data.choices[0].message.content;
      return res.json({ success: true, reply: aiReply });
    }

    res.json({ success: true, reply: `Macnaha: "${userMessage}" - AI Teacher: So dhowow! Soo qor qoraal kale.` });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
