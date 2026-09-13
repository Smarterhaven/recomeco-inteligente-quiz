# Recomeço Inteligente — Quiz

Versão para GitHub Pages com **todos os arquivos na raiz** (sem pasta `assets`).

Fluxo:

Quiz → análise → captura de nome/e-mail/telefone → resultado → VSL → oferta → checkout.

## Upload no GitHub

Envie estes 8 arquivos diretamente para a raiz do repositório:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `sobrecarga-quiz.jpg`
- `floral.jpg`
- `vsl-poster.jpg`
- `vsl.mp4`

Depois publique em **Settings → Pages → Deploy from a branch → main → /(root)**.

## Importante sobre os contatos

A tela de nome/e-mail/telefone já está funcionando para liberar o resultado e registrar o evento `lead_submit` no navegador.
Para os dados chegarem a uma lista, planilha ou ferramenta de e-mail/CRM, ainda é necessário conectar um destino de leads (por exemplo, Brevo, MailerLite, Google Sheets via webhook, Formspree etc.).

Checkout Hotmart configurado no `app.js`.
