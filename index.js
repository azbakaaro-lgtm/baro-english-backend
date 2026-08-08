const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Load Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// System Prompt for AI Teacher & Translator
const SYSTEM_INSTRUCTION = `
  Waxaad tahay Macallin English oo u jawaabaya arday Somali ah, isla markaana ah Turjumaan (English to Somali Translator).
  1. Haddii uu ardaygu kugu soo qoro qoraal English ah, iigu turjum Af-Somali doona, ka dibna u sharrax naxwaha (grammar-ka) iyo ereyada cusub.
  2. Si asluub iyo dhiirrigelin leh oo gaaban u jawaab.
`;

app.get('/', (req, res) => {
  res.send('API-ga App-ka English-ka waa ready!');
});

// 1. User Registration (Is-diiwaangelin)
app.post('/api/register', async (req, res) => {
  const { fullName, email, role } = req.body; // role: 'user' ama 'admin'
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ full_name: fullName, email: email, role: role || 'user' }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, user: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'System error during registration' });
  }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User-kan ma jiro' });
    return res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: 'Login error' });
  }
});

// 3. English to Somali Translate & AI Teacher Chat
app.post('/api/chat', async (req, res) => {
  const { userId, userMessage } = req.body;
  if (!userId || !userMessage) {
    return res.status(400).json({ error: 'userId iyo userMessage waa la rabbaa' });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent(userMessage);
    const aiResponse = result.response.text();

    // Save Chat in Supabase
    await supabase.from('student_chats').insert([{
      user_id: userId,
      english_text: userMessage,
      ai_response: aiResponse
    }]);

    return res.json({ success: true, reply: aiResponse });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'Eror ayaa ka dhacay adeegga AI-ga' });
  }
});

// 4. Admin Dashboard Endpoint (To view all users)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, users: data });
  } catch (err) {
    res.status(500).json({ error: 'Admin error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server-ku wuxuu ka shaqaynayaa port ${PORT}`));
