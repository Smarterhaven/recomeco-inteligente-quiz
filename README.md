# Recomeço Inteligente — Quiz

Versão para GitHub Pages com **todos os arquivos na raiz** (sem pasta `assets`).

Fluxo:

Quiz → análise → captura de nome/e-mail/telefone → envio automático para Google Sheets → resultado → VSL → oferta → checkout.

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

## Leads

O `app.js` está conectado ao Web App do Google Apps Script informado para registrar na planilha:

Data, Nome, Email, Telefone, Perfil, Carga Mental, Clareza, Tempo para Você, Controle, Origem, Campanha e Anúncio.

## Popup de saída

O popup com cupom `LANÇAMENTO` é habilitado apenas na oferta e respeita 25 segundos mínimos antes da intenção de saída.

Checkout Hotmart configurado no `app.js`.
