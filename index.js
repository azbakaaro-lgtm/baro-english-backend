const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Registration Endpoint
app.post('/api/register', async (req, res) => {
  const { fullName, email, role } = req.body;
  const { data, error } = await supabase
    .from('users')
    .insert([{ full_name: fullName, email, role }])
    .select();

  if (error) return res.status(400).json({ success: false, error: error.message });
  res.json({ success: true, user: data[0] });
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(404).json({ success: false, error: "Email-kan ma jiro" });
  res.json({ success: true, user: data });
});

// AI Chat Endpoint (Updated Gemini API)
app.post('/api/chat', async (req, res) => {
  const { userId, userMessage } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are an English teacher for Somali students. Answer the user in clear Somali and explain their English message: ${userMessage}` }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini Error:", data);
      return res.status(500).json({ success: false, error: "Gemini API failure" });
    }

    const aiReply = data.candidates[0].content.parts[0].text;

    // Save Chat to Supabase
    await supabase.from('student_chats').insert([
      { user_id: userId, english_text: userMessage, ai_response: aiReply }
    ]);

    res.json({ success: true, reply: aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
