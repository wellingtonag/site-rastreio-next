# 🔎 Site Rastreio de Acesso com Next.js e PostgreSQL (Neon)

Este projeto é um *refactoring* de um rastreador de acesso simples, migrado de HTML/CSS/JS puro para o moderno **Next.js App Router**. Ele coleta informações detalhadas do cliente (IP, Geolocalização, Navegador, Dispositivo) e as armazena de forma persistente em um banco de dados PostgreSQL (utilizando Neon para hospedagem).

---

## ✨ Tecnologias Principais

| Área | Tecnologia | Detalhe |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+** | App Router, Server Components, Route Handlers. |
| **Frontend** | **React** e **TypeScript** | Componente Cliente (`'use client'`) para detecção de informações. |
| **Estilo** | **CSS Global** | Estilização responsiva com Media Queries para dispositivos menores. |
| **Banco de Dados** | **PostgreSQL** | Utilizado para persistência dos dados de acesso. |
| **Conexão DB** | **`pg` (Node-Postgres)** | Driver para interação com o PostgreSQL. |
| **Hospedagem DB** | **Neon** | Serviço de *serverless* PostgreSQL. |

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos

- Node.js (versão 18.17 ou superior)
- npm ou Yarn

### 2. Configuração do Banco de Dados

O projeto salva os dados de acesso através de um Route Handler (`/api/record-access`).

1.  Crie uma conta no [Neon](https://neon.tech/) ou tenha acesso a um banco de dados PostgreSQL.
2.  Obtenha a **Connection String** do seu banco de dados.
3.  Crie um arquivo chamado **`.env`** na raiz do projeto e adicione a sua string de conexão:

```env
# URL de conexão com seu banco de dados PostgreSQL (Ex: Neon)
DATABASE_URL="postgresql://user:password@host:port/database_name?sslmode=require"
```
**Importante:** Garanta que a sua tabela acessos esteja criada no banco de dados com as colunas esperadas (ip_address, cidade, navegador, sistema_operacional, etc.) para evitar erros de inserção.

### 1. Instalação e Inicialização

```bash
# Clone o repositório
git clone [SEU_LINK_DO_REPOSITORIO]
cd site-rastreio-next

# Instale as dependências
npm install
# ou yarn install

# Execute o servidor de desenvolvimento
npm run dev
# ou yarn dev
```

Abra (http://localhost:3000) no seu navegador. A página exibirá os detalhes do seu acesso e enviará esses dados para o banco de dados.

💡 Saiba Mais
[Next.js Documentation](https://nextjs.org/docs) - Saiba mais sobre o App Router e funcionalidades modernas.

[next/font](https://nextjs.org/docs/app/getting-started/fonts) - Documentação sobre como o Next.js otimiza a fonte Geist utilizada no projeto.

🚀 Deploy
O método mais fácil para fazer o deploy da sua aplicação Next.js é utilizando a [Vercel Platform](https://vercel.com/).