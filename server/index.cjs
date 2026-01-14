require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NfceModel = require('./models/NfceModel.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// --- CONEXÃO MONGODB ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Erro: MONGO_URI não definida no arquivo .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectado com Sucesso!'))
  .catch(err => console.error('❌ Erro de conexão MongoDB:', err));

// --- CONFIGURAÇÃO GOOGLE GENAI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- ROTAS DA API ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Proxy para IA (OCR)
app.post('/api/ai/analyze-receipt', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extraia dados de nota fiscal de combustível deste documento. 
    Retorne APENAS um JSON válido com os seguintes campos (se encontrar):
    {
      "posto": { "razaoSocial": "", "cnpj": "", "endereco": "", "cep": "", "fone": "" },
      "produtos": [{ "nome": "", "quantidade": "", "valorUnitario": "", "total": "" }],
      "totais": { "valorTotal": "" }
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpar markdown se a IA retornar
    text = text.replace(/```json|```/g, '').trim();
    
    const jsonData = JSON.parse(text);
    res.json(jsonData);
  } catch (error) {
    console.error('Erro no processamento da IA:', error);
    res.status(500).json({ error: 'Falha ao processar imagem com IA', details: error.message });
  }
});

// Listar Modelos
app.get('/api/models', async (req, res) => {
  try {
    const models = await NfceModel.find().sort({ updatedAt: -1 });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar/Salvar Modelo
app.post('/api/models', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    
    let savedModel;
    // Verifica se o ID parece um ObjectId do MongoDB (24 chars hex)
    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
      savedModel = await NfceModel.findByIdAndUpdate(id, data, { new: true, upsert: true });
    } else {
      const newModel = new NfceModel(data);
      savedModel = await newModel.save();
    }
    
    res.status(201).json(savedModel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar Modelo por ID
app.put('/api/models/:id', async (req, res) => {
  try {
    const updatedModel = await NfceModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedModel) return res.status(404).json({ message: 'Modelo não encontrado' });
    res.json(updatedModel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar Modelo
app.delete('/api/models/:id', async (req, res) => {
  try {
    await NfceModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Modelo removido do banco de dados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📡 Servidor API rodando na porta ${PORT}`);
});
