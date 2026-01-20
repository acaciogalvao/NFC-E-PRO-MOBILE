import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar .env da raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import NfceModel from './models/NfceModel';

// --- VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE ---
const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const env = envSchema.parse(process.env);

const app = express();
const PORT = env.PORT;

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));

// --- CONEXÃO MONGODB ---
mongoose
  .connect(env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectado com Sucesso!'))
  .catch((err) => {
    console.error('❌ Erro de conexão MongoDB:', err);
    process.exit(1);
  });

// --- CONFIGURAÇÃO GOOGLE GENAI ---
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// --- ROTAS DA API ---

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Proxy para IA (OCR) com Prompt Refinado
app.post('/api/ai/analyze-receipt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Você é um especialista em extração de dados de notas fiscais de combustível (NFC-e).
      Analise a imagem fornecida e extraia as informações com a maior precisão possível.
      
      Regras:
      1. Se um campo não for encontrado, retorne uma string vazia "".
      2. Remova símbolos de moeda (R$) e use ponto como separador decimal.
      3. Identifique corretamente o posto, os produtos (combustíveis) e os totais.
      
      Retorne APENAS um JSON válido no seguinte formato:
      {
        "posto": {
          "razaoSocial": "Nome do Posto",
          "cnpj": "00.000.000/0000-00",
          "endereco": "Rua, Número, Bairro, Cidade - UF",
          "cep": "00000-000",
          "fone": "(00) 0000-0000"
        },
        "produtos": [
          {
            "nome": "GASOLINA ORIGINAL C",
            "quantidade": "10.50",
            "valorUnitario": "5.89",
            "total": "61.85"
          }
        ],
        "totais": {
          "valorTotal": "61.85"
        },
        "confianca": 0.95
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();

    // Limpar markdown se a IA retornar
    text = text.replace(/```json|```/g, '').trim();

    const jsonData = JSON.parse(text);
    res.json(jsonData);
  } catch (error) {
    next(error);
  }
});

// Listar Modelos
app.get('/api/models', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await NfceModel.find().sort({ updatedAt: -1 });
    res.json(models);
  } catch (error) {
    next(error);
  }
});

// Criar/Salvar Modelo
app.post('/api/models', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, ...data } = req.body;

    let savedModel;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      savedModel = await NfceModel.findByIdAndUpdate(id, data, { new: true, upsert: true });
    } else {
      const newModel = new NfceModel(data);
      savedModel = await newModel.save();
    }

    res.status(201).json(savedModel);
  } catch (error) {
    next(error);
  }
});

// Atualizar Modelo por ID
app.put('/api/models/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedModel = await NfceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedModel) return res.status(404).json({ message: 'Modelo não encontrado' });
    res.json(updatedModel);
  } catch (error) {
    next(error);
  }
});

// Deletar Modelo
app.delete('/api/models/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await NfceModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Modelo removido do banco de dados' });
  } catch (error) {
    next(error);
  }
});

// --- MIDDLEWARE DE ERRO GLOBAL ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Erro detectado:', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.issues,
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message || 'Ocorreu um erro inesperado',
  });
});

app.listen(PORT, () => {
  console.log(`📡 Servidor API rodando na porta ${PORT}`);
});
