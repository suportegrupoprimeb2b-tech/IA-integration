import React, { useMemo, useState } from 'react';
import {
  Bot, FileText, KeyRound, Lock, MessageSquareText, Mic, RefreshCw,
  Search, ShieldCheck, Sparkles, Wand2
} from 'lucide-react';
import { buildClientMemory, classifyIntent, formatInterfaceFacts } from './aiTestUtils.mjs';

const ACCESS_PASSWORD = 'prime2026';
const GEMINI_MODEL = 'gemini-2.5-flash';

const scenarios = [
  {
    id: 1,
    name: 'Cotação padrão / Eletrônicos',
    client: 'TechCorp Brasil S.A.',
    cnpj: '12.345.678/0001-90',
    payment: 'Faturado 30 dias',
    items: [
      { code: 'MON-DELL-P2723QE', desc: 'Monitor Dell UltraSharp 27" 4K', qty: 2, price: 2450 },
    ],
  },
  {
    id: 2,
    name: 'Suprimentos / Múltiplos',
    client: 'Inova Comércio e Logística LTDA',
    cnpj: '98.765.432/0001-11',
    payment: 'Faturado 15/30/45 dias',
    items: [
      { code: 'PAP-A4-CHAMEX', desc: 'Papel A4 Chamex 75g', qty: 50, price: 190 },
      { code: 'TONER-HP-W1050A', desc: 'Toner HP LaserJet Preto', qty: 10, price: 380 },
    ],
  },
];

const assistantPreset = `Você é um assistente administrativo do Grupo Prime B2B. Responda em português, cite apenas informações fornecidas e dê sugestões práticas. Nunca invente dados de clientes, preços, estoque ou políticas. Quando faltar dado, pergunte uma questão objetiva.`;

const responseCatalog = {
  COTACAO: 'Posso ajudar a preparar uma cotação. Para continuar, informe o produto desejado, a quantidade e a condição de pagamento.',
  RELATORIO: 'Vou orientar a criação de um relatório. Informe o período e os indicadores desejados, como vendas, ticket médio, margem ou pedidos.',
  ASSISTENTE: 'Posso sugerir melhorias na interface. Descreva a tela, o problema ou o comportamento que você gostaria de melhorar.',
  GERAL: 'Posso ajudar com cotações, relatórios ou melhorias na interface. Digite 1 para cotação, 2 para relatório ou 3 para sugestões.',
};

function QuoteTestTab() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('relatorio');
  const [selectedScenarioId, setSelectedScenarioId] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [reportError, setReportError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', content: 'Olá! Digite 1 para cotação, 2 para relatório ou 3 para sugestões de interface.' },
  ]);
  const [chatStatus, setChatStatus] = useState('Pronto');

  const currentScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];

  const memory = useMemo(
    () => buildClientMemory({
      clientName: 'Operação Prime',
      page: 'Aba de Testes de IA',
      lastTopic: activeTab,
      messages: chatMessages,
    }),
    [activeTab, chatMessages],
  );

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      setPasswordError('');
      return;
    }
    setPasswordError('Senha incorreta.');
  };

  const requestGemini = async (prompt) => {
    const currentApiKey = apiKey.trim();
    if (!currentApiKey) {
      throw new Error('Informe sua chave atual da API do Google Gemini para usar o Gemini 2.5 Flash.');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': currentApiKey,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      const message = data.error?.message || 'Não foi possível acessar o modelo de IA.';
      if (
        response.status === 401
        || response.status === 403
        || /API_KEY_INVALID|invalid authentication credentials|API key not valid|UNAUTHENTICATED/i.test(message)
      ) {
        throw new Error(`A chave atual do Gemini foi recusada. Confira se ela está válida e se a Generative Language API está habilitada. Detalhe: ${message}`);
      }
      throw new Error(message);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'A IA não retornou conteúdo.';
  };

  const runReportTest = async () => {
    setIsLoading(true);
    setReportError('');
    setReport('');

    try {
      const prompt = `Você é o motor de relatório administrativo do Grupo Prime B2B. Analise a seguinte cotação e gere um relatório executivo em português com: resumo executivo, itens, margem estimada, risco comercial, ações recomendadas e conclusão. Use apenas os dados fornecidos.\n\n${JSON.stringify(currentScenario, null, 2)}`;
      const generated = await requestGemini(prompt);
      setReport(generated.replace(/```(?:json|markdown)?/gi, '').trim());
    } catch (error) {
      setReportError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', content: trimmed };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput('');
    setIsLoading(true);
    setChatStatus('Analisando intenção');

    const intent = classifyIntent(trimmed);
    const normalized = trimmed.toLowerCase().trim();
    const directAnswer = responseCatalog[intent] || responseCatalog.GERAL;
    const memoryPrompt = `${formatInterfaceFacts(memory)}\n\nHistórico relevante: ${memory.relevantMessages.map((message) => message.content).join(' | ') || 'Nenhuma conversa anterior.'}\n\nResposta requerida: responda em português e ajude o cliente com a intenção ${intent}.`;

    let botContent = directAnswer;
    if (normalized === '1' || normalized === '2' || normalized === '3') {
      const map = { '1': 'cotação', '2': 'relatório', '3': 'sugestões de interface' };
      botContent = `A opção selecionada foi ${map[normalized]}. Escolha a aba correspondente para continuar o teste.`;
    }

    try {
      if (intent !== 'GERAL' || normalized === '1' || normalized === '2' || normalized === '3') {
        const aiResponse = await requestGemini(`${assistantPreset}\n\n${memoryPrompt}\n\nPergunta do cliente: ${trimmed}\n\nUse uma resposta curta e prática, em português.`);
        botContent = aiResponse.replace(/```/g, '').trim() || botContent;
      }
    } catch (error) {
      botContent = `${directAnswer} Atenção: o teste de IA não está disponível no momento. ${error.message}`;
    } finally {
      setChatMessages((current) => [...current, { role: 'bot', content: botContent }]);
      setChatStatus('Resposta pronta');
      setIsLoading(false);
    }
  };

  const assistantSuggestions = [
    'Aba de testes separada para cada módulo.',
    'Botão de copiar resposta e relatório.',
    'Indicadores com progresso visual e status claramente identificáveis.',
    'Histórico persistente de conversas na conta do cliente.',
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3"><ShieldCheck className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Área de testes</p>
              <h1 className="text-xl font-bold text-white">B2B Pro · IA</h1>
            </div>
          </div>
          <label htmlFor="accessPassword" className="mb-2 block text-sm font-medium text-slate-200">Senha de acesso</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              id="accessPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-0 focus:border-blue-500"
              placeholder="Senha restrita"
            />
          </div>
          {passwordError && <p className="mt-2 text-xs text-red-400">{passwordError}</p>}
          <button type="submit" className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
            Acessar testes de IA
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-500">A senha de teste não aparece na interface. A chave da API está bloqueada atrás da autenticação.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Grupo Prime B2B</p>
            <h1 className="text-xl font-bold">Painel de testes de IA</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Google Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="geminiApiKey" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
            <KeyRound className="h-4 w-4 text-blue-600" />
            Chave atual da API do Google Gemini
          </label>
          <input
            id="geminiApiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:max-w-xl"
            placeholder="Cole aqui a chave válida de hoje"
          />
          <p className="mt-2 text-xs text-slate-500">
            O modelo usado é <strong>gemini-2.5-flash</strong>. A chave fica somente na memória desta página e precisa ser informada novamente ao recarregar.
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Ambiente administrativo</p>
              <h2 className="mt-1 text-2xl font-bold">Três testes de IA para evolução da plataforma</h2>
              <p className="mt-1 text-sm text-blue-100">Relatório, chat do comprador e assistente de melhorias.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs">
              <KeyRound className="h-4 w-4 text-emerald-300" />
              Chave de teste gerenciada nesta sessão
            </div>
          </div>
        </section>

        <nav className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { key: 'relatorio', label: '1. IA geradora de relatório', icon: FileText },
            { key: 'chat', label: '2. Chat do comprador', icon: MessageSquareText },
            { key: 'assistente', label: '3. IA assistiva', icon: Wand2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${activeTab === key ? 'border-blue-600 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            >
              <span className={`rounded-xl p-2 ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold">{label}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'relatorio' && (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Teste administrativo</p>
                  <h3 className="text-lg font-bold">Selecionar cenário</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">1 token de triagem</span>
              </div>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <button key={scenario.id} type="button" onClick={() => setSelectedScenarioId(scenario.id)} className={`w-full rounded-xl border p-3 text-left ${selectedScenarioId === scenario.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-bold">{scenario.name}</span>
                      <span className="text-[10px] font-bold text-blue-700">#{scenario.id}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{scenario.client}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={runReportTest} disabled={isLoading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Gerar relatório com IA
              </button>
              <p className="mt-2 text-[10px] text-slate-500">A classificação da intenção é feita localmente e consome apenas um token de contexto interno.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold">Resultado do relatório</h3>
              </div>
              {isLoading && <div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Gerando relatório...</div>}
              {reportError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{reportError}</div>}
              {report && <pre className="max-h-[620px] whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">{report}</pre>}
              {!isLoading && !report && !reportError && <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">Selecione um cenário e gere o relatório.</div>}
            </div>
          </section>
        )}

        {activeTab === 'chat' && (
          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold">Configuração do chatbot</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><strong className="text-slate-800">1.</strong> Cotação</div>
                <div className="rounded-xl bg-slate-50 p-3"><strong className="text-slate-800">2.</strong> Relatório</div>
                <div className="rounded-xl bg-slate-50 p-3"><strong className="text-slate-800">3.</strong> Sugestões de interface</div>
              </div>
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                A intenção é classificada por um único token interno. A memória guarda o cliente, a página e os temas recentes para responder dúvidas básicas.
              </div>
            </div>

            <div className="flex min-h-[560px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-600 p-2 text-white"><Bot className="h-5 w-5" /></span>
                  <div><p className="text-sm font-bold">IA de apoio ao comprador</p><p className="text-[10px] text-slate-500">{chatStatus}</p></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Memória ativa</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                {chatMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={(event) => { event.preventDefault(); sendChatMessage(); }} className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Digite sua mensagem..." className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                  <button type="submit" disabled={isLoading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Exemplo: “quero fazer uma cotação”, “2” ou “sugira melhorias”.</p>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'assistente' && (
          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-violet-600 p-2 text-white"><Wand2 className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assistência visual</p>
                  <h3 className="text-lg font-bold">Sugerir melhorias</h3>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {assistantSuggestions.map((suggestion) => <li key={suggestion} className="flex gap-2 rounded-xl bg-violet-50 p-3"><Mic className="mt-0.5 h-4 w-4 text-violet-600" />{suggestion}</li>)}
              </ul>
              <button type="button" onClick={async () => { setIsLoading(true); setChatStatus('Analisando interface'); try { const response = await requestGemini(`${assistantPreset}\n\n${formatInterfaceFacts(memory)}\n\nSugira até 3 melhorias práticas para a plataforma, priorizando experiência, clareza e conversão.`); setChatMessages((current) => [...current, { role: 'bot', content: response }]); } catch (error) { setChatMessages((current) => [...current, { role: 'bot', content: `Não foi possível analisar a interface. ${error.message}` }]); } finally { setIsLoading(false); setChatStatus('Sugestão pronta'); } }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading}>
                <Sparkles className="h-4 w-4" />
                Solicitar sugestões da IA
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold">Sugestões da IA assistiva</h3>
              </div>
              <div className="min-h-[340px] rounded-xl bg-slate-50 p-4">
                {chatMessages.filter((message) => message.role === 'bot').slice(-1).map((message, index) => (
                  <div key={`assistant-${index}`} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{message.content}</div>
                ))}
                {!chatMessages.some((message) => message.role === 'bot') && <p className="text-sm text-slate-400">As sugestões aparecerão aqui.</p>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default QuoteTestTab;
