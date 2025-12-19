
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const NfceModel = require('./models/NfceModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 

// --- CONEXÃO MONGODB ATLAS ---
// Utilizando a string de conexão fornecida pelo usuário
const MONGO_URI = 'mongodb+srv://acaciogalvao:acaciogalvao@nfc-epromobile.ckpw9jf.mongodb.net/nfce_db?retryWrites=true&w=majority&appName=NFC-eProMobile';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Conectado com Sucesso!'))
  .catch(err => console.error('❌ Erro de conexão MongoDB:', err));

// --- ROTAS DA API ---

// Health Check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
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
    // Se o modelo já tem um ID que não é temporário, tentamos atualizar
    const { id, ...data } = req.body;
    
    let savedModel;
    if (id && id.length >= 24) { // Padrão de ID do MongoDB
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
