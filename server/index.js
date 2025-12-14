const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const NfceModel = require('./models/NfceModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Permite conexões do Frontend
app.use(express.json({ limit: '50mb' })); // Aumenta limite para dados grandes

// --- CONEXÃO MONGODB ATLAS ---
const MONGO_URI = 'mongodb+srv://acaciogalvao:acacio1182@nfc-epromobile.ckpw9jf.mongodb.net/nfce_db?retryWrites=true&w=majority&appName=NFC-eProMobile';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Conectado!'))
  .catch(err => console.error('❌ Erro de conexão MongoDB:', err));

// --- ROTAS DA API ---

// Rota de Teste (Health Check Detalhado)
app.get('/api/health', async (req, res) => {
  try {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbState = mongoose.connection.readyState;
    
    let modelCount = 0;
    if (dbState === 1) {
      modelCount = await NfceModel.countDocuments();
    }

    res.json({
      status: 'online',
      serverTime: new Date().toISOString(),
      database: {
        connected: dbState === 1,
        stateCode: dbState
      },
      stats: {
        models: modelCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Rota raiz simples
app.get('/', (req, res) => {
  res.send('API NFC-e Pro Mobile está online 🚀');
});

/**
 * LISTAR TODOS OS MODELOS
 * GET /api/models
 */
app.get('/api/models', async (req, res) => {
  try {
    // Busca todos e ordena pelo mais recente
    const models = await NfceModel.find().sort({ updatedAt: -1 });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * OBTER UM MODELO POR ID
 * GET /api/models/:id
 */
app.get('/api/models/:id', async (req, res) => {
  try {
    const model = await NfceModel.findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Modelo não encontrado' });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * CRIAR NOVO MODELO
 * POST /api/models
 */
app.post('/api/models', async (req, res) => {
  try {
    const newModel = new NfceModel(req.body);
    const savedModel = await newModel.save();
    res.status(201).json(savedModel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ATUALIZAR MODELO EXISTENTE
 * PUT /api/models/:id
 */
app.put('/api/models/:id', async (req, res) => {
  try {
    const updatedModel = await NfceModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Retorna o objeto já atualizado
    );
    if (!updatedModel) return res.status(404).json({ message: 'Modelo não encontrado' });
    res.json(updatedModel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETAR MODELO
 * DELETE /api/models/:id
 */
app.delete('/api/models/:id', async (req, res) => {
  try {
    const deleted = await NfceModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Modelo não encontrado' });
    res.json({ message: 'Modelo deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`📡 Servidor rodando na porta ${PORT}`);
});