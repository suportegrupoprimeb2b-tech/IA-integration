# Grupo Prime B2B — Painel de Testes de IA

Aplicação React/Vite para testar recursos de IA de apoio à operação administrativa do Grupo Prime B2B.

## Executar localmente

```bash
npm install
npm run dev
```

Para gerar e testar o build de produção:

```bash
npm run build
npm run preview
```

## Deploy no Vercel

Configure o projeto com o preset **Vite**, o comando de build `npm run build` e a pasta de saída `dist`. O `index.html` é apenas o ponto de entrada; a interface é renderizada pelo React e os estilos Tailwind são compilados durante o build.

## Segurança

Esta interface é um protótipo de testes. Valores de senha e chaves incluídos no código frontend podem ser vistos por qualquer pessoa que acesse o site; não use credenciais reais. Para produção, mova as chamadas de IA para uma função backend e armazene a chave em uma variável de ambiente do servidor.
