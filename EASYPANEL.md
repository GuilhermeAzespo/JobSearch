# 🚀 Guia de Deploy no Easypanel — AI Job Search Web

Este guia explica passo a passo como fazer o deploy da aplicação **AI Job Search Web** no seu **Easypanel** em menos de 2 minutos.

---

## 📋 Pré-requisitos
- Uma instância do **Easypanel** ativa no seu servidor (VPS, Hetzner, DigitalOcean, etc.).
- Seu repositório no GitHub: `https://github.com/GuilhermeAzespo/JobSearch`

---

## 🛠️ Passo a Passo no Easypanel

### 1. Criar um Novo Projeto / App
1. Acesse o painel do **Easypanel**.
2. Clique no seu Projeto (ou crie um novo chamado `jobsearch`).
3. Clique em **+ New** e selecione **App** (ou **Application**).

### 2. Configurar a Fonte (Source: Git)
1. Na aba **Source**, selecione **Git Repository**.
2. Insira a URL do repositório:
   ```text
   https://github.com/GuilhermeAzespo/JobSearch
   ```
3. Defina a branch:
   ```text
   main
   ```
4. Se o repositório for privado, conecte sua conta do GitHub ou insira o Deploy Key / Token.
5. Em **Build Type**, o Easypanel detectará automaticamente o **Dockerfile** presente na raiz do projeto.

### 3. Configurar a Porta de Rede (Port)
1. Na aba **Environment** ou **Network / Domains**:
   - Defina a porta do contêiner como: `3000`.
   - Adicione o seu domínio ou subdomínio (ex: `vagas.seudominio.com` ou o subdomínio gerado pelo Easypanel).
   - Ative o **SSL / HTTPS** automático (Let's Encrypt gratuito do Easypanel).

### 4. Persistência de Dados (Volumes - Recomendado)
Para que suas candidaturas, anotações e perfis continuem salvos mesmo após atualizações ou reinicializações do contêiner:
1. Vá na aba **Mounts / Volumes**.
2. Adicione um novo mount:
   - **Type**: Volume
   - **Mount Path**: `/app/data`
3. Salve a alteração.

### 5. Variáveis de Ambiente (Opcional)
Na aba **Environment Variables**, você pode adicionar:
```env
NODE_ENV=production
PORT=3000
```
*(Você também pode configurar suas chaves de API da Anthropic, OpenAI ou Gemini diretamente pela interface Web nas Configurações da plataforma).*

### 6. Fazer o Deploy
1. Clique no botão **Deploy** no topo superior direito.
2. O Easypanel irá:
   - Fazer o clone do repositório `GuilhermeAzespo/JobSearch`.
   - Construir a imagem Docker Alpine multi-stage otimizada.
   - Subir o contêiner e emitir o certificado SSL.
3. Pronto! Acesse a URL do seu domínio configurado.

---

## 🔄 Atualizações Automáticas (Auto-Deploy)
Se desejar que novas melhorias enviadas ao GitHub sejam publicadas automaticamente:
1. No Easypanel, na aba do App, copie a URL do **Deploy Webhook**.
2. No seu repositório GitHub (`GuilhermeAzespo/JobSearch`), vá em **Settings &rarr; Webhooks &rarr; Add Webhook**.
3. Cole a URL do webhook e selecione o evento **Push**.
4. Sempre que você fizer `git push`, o Easypanel atualizará o sistema automaticamente!

