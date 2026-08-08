const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    const { data, error } = await supabase
      .from('users')
      .insert([{ full_name: fullName, email, role }])
      .select();

    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, user: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: "Email-kan ma jiro" });
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { userMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Model Endpoint cusub (gemini-2.0-flash)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are a helpful English teacher for Somali students. Translate this to Somali and explain briefly: ${userMessage}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);
      return res.status(500).json({ success: false, error: data.error?.message || "Gemini Error" });
    }

    const aiReply = data.candidates[0].content.parts[0].text;
    res.json({ success: true, reply: aiReply });

  } catch (err) {
    console.error("Server Crash Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
