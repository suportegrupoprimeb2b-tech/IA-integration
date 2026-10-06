const CATEGORY_TOKENS = {
  COTACAO: ['cotacao', 'cotação', 'pedido', 'comprar', 'orçamento', 'orcamento'],
  RELATORIO: ['relatorio', 'relatório', 'desempenho', 'indicador', 'resumo', 'dashboard'],
  ASSISTENTE: ['melhorar', 'melhoria', 'interface', 'sugestao', 'sugestões', 'problema', 'ajuda'],
};

export function classifyIntent(message = '') {
  const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const [category, tokens] of Object.entries(CATEGORY_TOKENS)) {
    if (tokens.some((token) => normalized.includes(token))) {
      return category;
    }
  }

  return 'GERAL';
}

export function buildClientMemory({
  clientName = 'Cliente',
  page = 'Plataforma',
  lastTopic = 'geral',
  messages = [],
} = {}) {
  const relevantMessages = messages
    .slice(-8)
    .filter((message) => message && typeof message.content === 'string' && message.content.trim());

  const summary = [
    `Cliente: ${clientName}`,
    `Página atual: ${page}`,
    `Último tema: ${lastTopic}`,
    `Perguntas anteriores: ${relevantMessages.length}`,
  ].join(' | ');

  return {
    clientName,
    page,
    lastTopic,
    summary,
    relevantMessages,
  };
}

export function formatInterfaceFacts(memory) {
  return `Conhecimento disponível: ${memory.clientName} está em ${memory.page}. O cliente já abordou ${memory.lastTopic}. Contexto: página de teste com Pesquisa, catálogo, cotações e administração.`;
}
