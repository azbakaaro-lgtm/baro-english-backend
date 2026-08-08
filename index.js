const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Registration Endpoint
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

// Login Endpoint
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

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userMessage } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Free Fallback if key is missing in Render Environment
      return res.json({ 
        success: true, 
        reply: `Macnaha: "${userMessage}"\n\nAI Teacher: Farriintaadii waa la helay! Waxaad ku dhex jirtaa Baro English AI.` 
      });
    }

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

    res.json({ 
      success: true, 
      reply: `Macnaha: "${userMessage}"\n\nAI Teacher: Ku soo dhawaow casharka! Naxwaha qoraalkaaga waa sax.` 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
