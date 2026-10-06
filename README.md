# 🚀 Grupo Prime B2B - Aba de Testes de Cotações & Inteligência Artificial

Este repositório contém a solução completa para a nova **Aba de Testes de Cotações** do Portal Administrativo B2B do **Grupo Prime**. O objetivo desta interface é permitir que a gestão valide e teste cenários reais de cotação com Inteligência Artificial, efetuando o cruzamento automatizado com o ERP e validando a minuta comercial antes da liberação definitiva para produção.

---

## 🎨 O que foi desenvolvido

A solução atende 100% aos requisitos de negócios e especificações técnicas solicitadas:

1. **Configuração da API & Interface Admin**:
   - Campo de entrada seguro de Chave de API (`type="password"`) com botão de visibilidade (ícone de olho).
   - Suporte para chaves Anthropic Claude / OpenAI e fallback automático para o motor de simulação inteligente local quando a chave não for fornecida.
   - Painel responsivo dividido em duas colunas: **Esquerda (Entrada do Pedido & ERP)** e **Direita (Saída/Análise da IA & Minuta Commercial)**.

2. **Os 3 Cenários Práticos de Cotação (Seleção Rápida)**:
   - **Exemplo 1: Cotação Padrão / Eletrônicos**: 2x Monitores Dell 27" 4K. Solicitado dentro da margem ideal do ERP (Status: *Aprovado com Margem Ideal*).
   - **Exemplo 2: Cotação Suprimentos / Múltiplos Itens**: 50x Caixas de Papel A4, Toners e Canetas. Apresenta pedido de desconto abaixo da margem mínima permitida (Status: *Requer Ajuste de Preço* - Margem ajustada automaticamente para 18%).
   - **Exemplo 3: Cotação Atípica / Produto Sob Consulta**: Válvula industrial com PN obsoleto/desatualizado e estoque 0 (Status: *Estoque Insuficiente / Produto Sob Consulta* - Substituição automática pelo novo modelo equivalente).

3. **Motor de Revisão e Cruzamento ERP**:
   - Botão em destaque: `🤖 Executar Revisão Inteligente do Pedido`.
   - Simulação de etapas com barra de progresso em tempo real.
   - Tabela do ERP integrada exibindo Preço de Custo, Preço Tabela, Margem % e Disponibilidade em Estoque.
   - Relatório de saída estruturado com:
     * Badge de Status Sugerido e Score de Risco Comercial.
     * Tabela comparativa item a item (Solicitado vs. Tabela ERP vs. Sugerido IA).
     * Parecer executivo de conformidade.

4. **Ação do Gestor (Human-in-the-Loop)**:
   - Minuta comercial em formato de carta corporativa redigida pela IA, disponibilizada em um `textarea` inteiramente editável para o gestor ajustar condições, prazos ou descontos.
   - Botão final de destaque `✅ Aprovar e Enviar Proposta` que dispara modal de encerramento do fluxo comercial e simula o registro no ERP.

---

## 📂 Arquivos Entregues

- **`index.html`**: Aplicação Web Single-Page (SPA) pronta e autocontida construída em HTML5, Tailwind CSS (via CDN) e JavaScript puro. Pode ser aberta **diretamente em qualquer navegador** sem necessidade de compilação ou instalação de pacotes (`npm`).
- **`QuoteTestTab.jsx`**: Componente React funcional estilizado com Tailwind CSS e ícones do `lucide-react`, pronto para ser copiado e importado diretamente no projeto Next.js / Vite / React do Grupo Prime B2B.

---

## 🛠️ Como Executar

### Opção 1: Execução Direta no Navegador (`index.html`)
1. Dê um duplo clique no arquivo `index.html` ou abra-o em qualquer navegador (Chrome, Edge, Firefox, Safari).
2. Insira opcionalmente a sua Chave de API de IA no topo da tela.
3. Clique em um dos 3 exemplos rápidos na barra superior.
4. Clique em **"🤖 Executar Revisão Inteligente do Pedido"**.
5. Edite a minuta se desejar e clique em **"✅ Aprovar e Enviar Proposta"**.

### Opção 2: Integração no Projeto React / Next.js (`QuoteTestTab.jsx`)
1. Instale a biblioteca de ícones caso ainda não possua:
   ```bash
   npm install lucide-react
   ```
2. Importe o componente no seu painel administrativo:
   ```jsx
   import QuoteTestTab from './QuoteTestTab';

   export default function AdminPage() {
     return (
       <div>
         <QuoteTestTab />
       </div>
     );
   }
   ```

---

## 🛡️ Segurança & Privacidade de Dados
- A chave de API inserida permanece armazenada estritamente na memória volátil da sessão no navegador do gestor.
- Não há envio de chaves de API para servidores intermediários não autorizados.
