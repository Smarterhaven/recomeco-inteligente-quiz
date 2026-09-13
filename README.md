# Recomeço Inteligente — Quiz

Funil estático mobile-first, sem backend:

Quiz → análise → resultado → VSL → oferta → checkout.

## Publicar gratuitamente no GitHub Pages

1. Crie um repositório público chamado `recomeco-inteligente-quiz`.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Branch: `main`, pasta: `/ (root)` e clique em **Save**.
6. Aguarde 1–3 minutos. O endereço será parecido com:
   `https://SEU-USUARIO.github.io/recomeco-inteligente-quiz/`

## Antes de colocar tráfego

Abra `app.js` e troque:

```js
const CHECKOUT_URL = 'https://example.com/checkout';
```

pelo checkout real da Hotmart.

### Arquivos principais
- `index.html`: estrutura da página.
- `styles.css`: design e flores do fundo.
- `app.js`: quiz, cálculos, VSL, oferta, cupom e UTMs.
- `assets/sobrecarga-quiz.jpg`: imagem emocional.
- `assets/vsl.mp4`: VSL.
- `assets/floral.jpg`: decoração floral.

O quiz sempre zera as respostas ao clicar em **COMEÇAR MINHA ANÁLISE**, portanto nenhuma opção inicia pré-selecionada.
