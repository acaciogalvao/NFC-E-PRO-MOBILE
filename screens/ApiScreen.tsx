import React from 'react';
import { Server, Database, Users, CheckCircle, RefreshCw, FileText } from 'lucide-react';

const ApiScreen: React.FC = () => {
  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
            <Server size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Teste de Conexão<br/>API</h2>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none flex items-center gap-2">
          <RefreshCw size={16} /> Testar Tudo
        </button>
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        
        {/* API Server */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex items-start gap-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
               <Server size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Servidor API</h3>
               <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mt-1">
                 <CheckCircle size={16} />
                 <span className="font-bold text-sm">OK</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">API NFC-e Generator está funcionando</p>
             </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <div className="flex items-start gap-4">
             <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-green-600 dark:text-green-400">
               <Database size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Banco de Dados</h3>
               <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mt-1">
                 <CheckCircle size={16} />
                 <span className="font-bold text-sm">CONECTADO</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">Coleções: 1</p>
             </div>
          </div>
        </div>

        {/* Estações */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex items-start gap-4">
             <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
               <Users size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Estações</h3>
               <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mt-1">
                 <CheckCircle size={16} />
                 <span className="font-bold text-sm">0</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">modelos carregados</p>
             </div>
          </div>
        </div>

        {/* Status Geral */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <div className="flex items-start gap-4">
             <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600 dark:text-orange-400">
               <FileText size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Status Geral</h3>
               <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mt-1">
                 <div className="bg-green-600 text-white rounded text-[10px] px-1 font-bold">✓</div>
                 <span className="font-bold text-sm text-slate-700 dark:text-slate-200">TUDO OK</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">Sistema operacional</p>
             </div>
          </div>
        </div>
      </div>

      {/* Modelos List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
           <Users size={16} className="text-slate-400" />
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Últimos Modelos (0)</h3>
         </div>
         <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="p-4 text-center text-xs text-slate-400 italic">
               Nenhum modelo carregado.
            </div>
         </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Endpoints da API</h3>
         </div>
         <div className="p-3 space-y-2">
            {[
              { m: 'GET', p: '/api/health', c: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
              { m: 'GET', p: '/api/stations', c: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
              { m: 'POST', p: '/api/stations', c: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
              { m: 'PUT', p: '/api/stations/:id', c: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
              { m: 'DELETE', p: '/api/stations/:id', c: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
              { m: 'GET', p: '/api/receipts/generate-number', c: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
            ].map((ep, i) => (
              <div key={i} className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded p-1.5">
                 <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${ep.c}`}>{ep.m}</span>
                 <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">{ep.p}</span>
              </div>
            ))}
            <div className="text-[10px] text-slate-400 mt-2">
              Base URL: <span className="font-mono">http://localhost:5000/api</span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ApiScreen;