import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyIntent,
  buildClientMemory,
  formatInterfaceFacts,
} from './aiTestUtils.mjs';

test('classifica a intenção com uma resposta curta de um token', () => {
  assert.equal(classifyIntent('quero fazer uma cotação'), 'COTACAO');
  assert.equal(classifyIntent('quero um relatório'), 'RELATORIO');
  assert.equal(classifyIntent('sugira melhorias na interface'), 'ASSISTENTE');
  assert.equal(classifyIntent('olá'), 'GERAL');
});

test('monta a memória do cliente com contexto básico e da interface', () => {
  const memory = buildClientMemory({
    clientName: 'TechCorp',
    page: 'B2B Pro',
    lastTopic: 'cotação',
    messages: [{ role: 'user', content: 'Quero fazer uma cotação' }],
  });

  assert.match(memory.summary, /TechCorp/);
  assert.match(memory.summary, /B2B Pro/);
  assert.match(memory.summary, /cotação/);
  assert.match(formatInterfaceFacts(memory), /Pesquisa/);
});
