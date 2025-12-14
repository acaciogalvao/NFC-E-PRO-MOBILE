import React from 'react';
import { Server, Database, Users, CheckCircle, RefreshCw, FileText, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ApiStatus } from '../App';

interface ApiScreenProps {
  apiStatus: ApiStatus;
  onRefresh: () => void;
}

const ApiScreen: React.FC<ApiScreenProps> = ({ apiStatus, onRefresh }) => {
  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
            <Server size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">Teste de Conexão<br/>API</h2>
        </div>
        <button 
          onClick={onRefresh}
          disabled={apiStatus.loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {apiStatus.loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
          Testar Conexão
        </button>
      </div>

      <div className="text-xs text-slate-400 text-right">
        Última verificação: {apiStatus.lastCheck || 'Nunca'}
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        
        {/* API Server */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-all">
          <div className={`absolute top-0 left-0 w-1 h-full ${apiStatus.online ? 'bg-blue-500' : 'bg-red-500'}`}></div>
          <div className="flex items-start gap-4">
             <div className={`p-2 rounded-lg ${apiStatus.online ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
               <Server size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Servidor API</h3>
               <div className={`flex items-center gap-1 mt-1 ${apiStatus.online ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                 {apiStatus.online ? <CheckCircle size={16} /> : <XCircle size={16} />}
                 <span className="font-bold text-sm">{apiStatus.online ? 'ONLINE' : 'OFFLINE'}</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">
                 {apiStatus.online ? 'API respondendo requisições' : 'Não foi possível conectar ao servidor'}
               </p>
             </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-all">
          <div className={`absolute top-0 left-0 w-1 h-full ${apiStatus.dbConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <div className="flex items-start gap-4">
             <div className={`p-2 rounded-lg ${apiStatus.dbConnected ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
               <Database size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Banco de Dados (MongoDB)</h3>
               <div className={`flex items-center gap-1 mt-1 ${apiStatus.dbConnected ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                 {apiStatus.dbConnected ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                 <span className="font-bold text-sm">{apiStatus.dbConnected ? 'CONECTADO' : 'DESCONECTADO'}</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">
                 {apiStatus.dbConnected ? 'Conexão Atlas estabelecida' : 'Verifique a string de conexão no backend'}
               </p>
             </div>
          </div>
        </div>

        {/* Estações (Modelos) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex items-start gap-4">
             <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
               <Users size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-700 dark:text-slate-200">Modelos na Nuvem</h3>
               <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mt-1">
                 <CheckCircle size={16} />
                 <span className="font-bold text-sm">{apiStatus.modelCount}</span>
               </div>
               <p className="text-xs text-slate-400 mt-1">registros encontrados no banco</p>
             </div>
          </div>
        </div>

      </div>

      {/* Status da Aplicação Local */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
           <FileText size={16} className="text-slate-400" />
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Diagnóstico</h3>
         </div>
         <div className="p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-500 dark:text-slate-400">Aplicação React</span>
               <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12} /> Rodando</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-500 dark:text-slate-400">Conexão Servidor</span>
               <span className={`font-bold flex items-center gap-1 ${apiStatus.online ? 'text-green-600' : 'text-red-500'}`}>
                 {apiStatus.online ? <CheckCircle size={12} /> : <XCircle size={12} />} 
                 {apiStatus.online ? 'Estável' : 'Sem Sinal'}
               </span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ApiScreen;