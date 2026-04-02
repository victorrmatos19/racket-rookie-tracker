# RacketPro — Gestão de Alunos de Tênis

Aplicativo mobile para professores de tênis gerenciarem alunos, agenda de aulas, pagamentos e despesas. Construído com **React Native + Expo**, conectado ao **Supabase** como backend.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Banco de Dados](#banco-de-dados)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Navegação](#navegação)
- [Telas](#telas)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Como rodar](#como-rodar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral

O RacketPro permite que professores de tênis:

- Cadastrem e acompanhem alunos com **7 métricas de habilidade** (Forehand, Backhand, Saque, Voleio, Slice, Físico, Tático)
- Visualizem a **agenda semanal** de aulas por dia e horário
- Controlem **receitas e despesas** mensais com gráficos anuais
- Confirmem **pagamentos de mensalidades** com método e data
- Gerenciem **usuários da plataforma** (painel admin)

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework mobile | React Native 0.81 + Expo SDK 54 |
| Navegação | Expo Router 6 (file-based routing) |
| Linguagem | TypeScript 5.9 |
| Backend / Banco | Supabase (PostgreSQL + Auth) |
| Sessão nativa | @react-native-async-storage/async-storage |
| Formulários | React Hook Form + Zod |
| Data fetching | TanStack React Query v5 |
| Gráficos | react-native-chart-kit + react-native-svg |
| Sliders | @react-native-community/slider |
| Date/Time picker | @react-native-community/datetimepicker |
| Toasts | react-native-toast-message |
| Ícones | @expo/vector-icons (Ionicons) |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│                  iPhone / Android            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           Expo Go / Build           │   │
│  │                                     │   │
│  │  ┌──────────┐    ┌───────────────┐ │   │
│  │  │ Expo     │    │ React Native  │ │   │
│  │  │ Router   │───▶│   Screens     │ │   │
│  │  │(app/ dir)│    │ & Components  │ │   │
│  │  └──────────┘    └───────┬───────┘ │   │
│  │                          │         │   │
│  │  ┌───────────────────────▼───────┐ │   │
│  │  │         Hooks / Context       │ │   │
│  │  │  useAuth  │  useUserRole      │ │   │
│  │  │  React Query (server state)   │ │   │
│  │  └───────────────────────┬───────┘ │   │
│  │                          │         │   │
│  │  ┌───────────────────────▼───────┐ │   │
│  │  │       lib/supabase.ts         │ │   │
│  │  │  createClient + AsyncStorage  │ │   │
│  │  └───────────────────────┬───────┘ │   │
│  └──────────────────────────┼─────────┘   │
└─────────────────────────────┼─────────────┘
                              │ HTTPS
                    ┌─────────▼─────────┐
                    │     Supabase      │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │  Auth (JWT) │  │
                    │  └─────────────┘  │
                    │  ┌─────────────┐  │
                    │  │  PostgreSQL │  │
                    │  │  (5 tables) │  │
                    │  └─────────────┘  │
                    │  ┌─────────────┐  │
                    │  │  Row Level  │  │
                    │  │  Security   │  │
                    │  └─────────────┘  │
                    └───────────────────┘
```

### Fluxo de autenticação

```
App inicia
    │
    ▼
_layout.tsx (RootLayoutNav)
    │
    ├── useAuth() loading=true ──▶ aguarda
    │
    ├── user=null ──▶ router.replace('/auth')
    │
    └── user=ok   ──▶ router.replace('/(tabs)')
                            │
                    Tab Navigator
                    ├── /         (Alunos)
                    ├── /schedule (Cronograma)
                    ├── /financial(Financeiro)
                    └── /sistema  (Admin — só se isAdmin=true)
```

---

## Estrutura de Arquivos

```
racketproapp/
│
├── app/                          # Expo Router — cada arquivo = rota
│   ├── _layout.tsx               # Root layout: AuthProvider, QueryClient, Toast
│   ├── auth.tsx                  # Tela pública de login/cadastro
│   └── (tabs)/                   # Grupo de rotas com tab navigator
│       ├── _layout.tsx           # Tabs + header customizado com logout
│       ├── index.tsx             # Tela de alunos (rota "/")
│       ├── schedule.tsx          # Cronograma semanal
│       ├── financial.tsx         # Financeiro
│       └── sistema.tsx           # Painel admin
│
├── components/                   # Componentes reutilizáveis
│   ├── StudentCard.tsx           # Card do aluno com barras de progresso
│   ├── AddStudentModal.tsx       # Modal para cadastrar aluno
│   ├── EditStudentModal.tsx      # Modal para editar aluno
│   ├── AddExpenseModal.tsx       # Modal para adicionar despesa
│   ├── EditExpenseModal.tsx      # Modal para editar despesa
│   ├── ConfirmPaymentModal.tsx   # Modal para confirmar pagamento
│   ├── CustomPicker.tsx          # Componente Select nativo (Modal + FlatList)
│   ├── StatsCard.tsx             # Card de estatística
│   └── PaymentStatusBadge.tsx    # Badge de status de pagamento
│
├── hooks/
│   ├── useAuth.tsx               # Context de autenticação (AuthProvider + useAuth)
│   └── useUserRole.tsx           # Hook que busca e expõe o role do usuário
│
├── lib/
│   └── supabase.ts               # Cliente Supabase configurado com AsyncStorage
│
├── types/
│   └── database.ts               # Tipos TypeScript das tabelas do Supabase
│
├── constants/
│   └── colors.ts                 # Paleta de cores do app
│
├── assets/
│   └── logo.png                  # Logo do app
│
├── app.json                      # Configuração do Expo (nome, scheme, ícone)
├── babel.config.js               # Babel com preset expo + reanimated plugin
├── metro.config.js               # Metro bundler
├── tsconfig.json                 # TypeScript (exclui pasta src/ legada)
└── package.json                  # Dependências
```

---

## Banco de Dados

Todas as tabelas usam **Row Level Security (RLS)** do Supabase — cada professor acessa apenas seus próprios dados via `user_id`.

### Diagrama de tabelas

```
auth.users (Supabase Auth)
    │
    ├──▶ profiles          (1:1)
    │     id, email, full_name, documento
    │
    ├──▶ user_roles        (1:1)
    │     user_id, role: 'administrador' | 'professor' | 'aluno'
    │
    ├──▶ students          (1:N)
    │     id, user_id, name, level, status
    │     class_days[], class_time, class_start_date, monthly_fee
    │     forehand/backhand/serve/volley/slice/physical/tactical_progress
    │
    ├──▶ student_payments  (via students, 1:N)
    │     student_id, user_id, reference_month (yyyy-MM)
    │     payment_status: 'pending'|'paid'|'overdue'
    │     amount_expected, amount_paid, payment_date, payment_method
    │
    └──▶ expenses          (1:N)
          user_id, description, amount, category, expense_date
```

### Enums e funções do banco

| Item | Descrição |
|---|---|
| `app_role` | `administrador` \| `professor` \| `aluno` |
| `get_user_role(user_id)` | Retorna o role do usuário |
| `has_role(user_id, role)` | Verifica se usuário tem determinado role |
| `encrypt_documento` | Criptografa CPF/CNPJ |
| `decrypt_documento` | Descriptografa CPF/CNPJ |

---

## Autenticação e Autorização

### Autenticação (Supabase Auth)
- Login e cadastro por **email + senha**
- Sessão persistida via **AsyncStorage** (nativo) ou **localStorage** (web)
- JWT renovado automaticamente (`autoRefreshToken: true`)
- No cadastro, dados extras (nome, documento, role) são salvos em `user.user_metadata` e espelhados na tabela `profiles` via trigger no Supabase

### Autorização por roles

| Role | Acesso |
|---|---|
| `professor` | Alunos, Cronograma, Financeiro |
| `administrador` | Tudo + aba Sistema |
| `aluno` | Sem acesso ao app (role de consulta futura) |

A aba **Sistema** é ocultada do tab bar para não-admins:

```tsx
// app/(tabs)/_layout.tsx
tabBarButton: isAdmin ? undefined : () => null
```

O hook `useUserRole` busca o role na tabela `user_roles` e expõe:
- `role` — valor bruto
- `isAdmin`, `isProfessor`, `isAluno` — booleans convenientes

---

## Navegação

O app usa **Expo Router** com file-based routing, similar ao Next.js App Router.

```
/auth              → app/auth.tsx          (público)
/                  → app/(tabs)/index.tsx  (protegido)
/schedule          → app/(tabs)/schedule.tsx
/financial         → app/(tabs)/financial.tsx
/sistema           → app/(tabs)/sistema.tsx (admin)
```

O guard de autenticação vive no `app/_layout.tsx`:

```tsx
useEffect(() => {
  if (loading) return;
  if (!user && !inAuthGroup) router.replace('/auth');
  if (user && inAuthGroup)  router.replace('/(tabs)');
}, [user, loading, segments]);
```

---

## Telas

### Auth (`/auth`)
- Abas nativas **Login / Cadastro**
- Formatação automática de CPF/CNPJ no cadastro
- Seletor de role (Professor / Aluno)

### Alunos (`/`)
- `FlatList` com paginação incremental (10 por vez)
- Busca por nome em tempo real
- Cards com 7 barras de progresso de habilidade
- Modais de adição e edição
- Exclusão com `Alert.alert` de confirmação
- Pull-to-refresh

### Cronograma (`/schedule`)
- Organiza alunos por dia da semana e horário
- Cards por dia com time slots agrupados
- Mostra apenas alunos com status `active` e horários definidos
- Pull-to-refresh

### Financeiro (`/financial`)
- Seletor de mês (últimos 12 meses)
- 4 cards de resumo: Recebido, Pendente, Despesas, Lucro Líquido
- Lista de despesas com edição e exclusão
- Gráfico de linha anual (Faturamento / Despesas / Lucro) via `react-native-chart-kit`
- Tabela de pagamentos mensais por aluno com botão "Confirmar"
- Geração automática de registros pendentes para alunos ativos sem pagamento no mês

### Sistema (`/sistema`) — admin only
- Cards de total de usuários e novos no mês
- Gráfico de crescimento (últimos 6 meses)
- Lista de usuários com nome, email e role

---

## Componentes

### `StudentCard`
Exibe os dados de um aluno. Internamente gerencia o estado do `EditStudentModal` e chama `Alert.alert` para confirmar exclusão.

```
StudentCard
├── Header (nome, nível, status badge, botões editar/excluir)
├── Skills grid (7 barras de progresso com View width %)
├── Schedule info (dias + horário)
└── EditStudentModal (controlled by local state)
```

### `CustomPicker`
Substitui o componente `<Select>` do shadcn/web. Abre um bottom sheet (Modal nativo) com lista de opções.

```
CustomPicker
├── TouchableOpacity trigger (mostra valor selecionado)
└── Modal
    ├── Header com título e botão fechar
    └── FlatList de opções com checkmark na selecionada
```

### Modais de formulário
Todos seguem o mesmo padrão:

```
[Nome]Modal
├── Modal (animationType="slide")
├── SafeAreaView
│   ├── Header (título + botão fechar)
│   ├── ScrollView (campos do formulário)
│   │   ├── TextInput
│   │   ├── CustomPicker
│   │   ├── DateTimePicker (data/hora)
│   │   └── Slider (progresso de habilidades)
│   └── Footer (botão de submit)
```

---

## Hooks

### `useAuth`

Contexto global de autenticação. Deve envolver toda a aplicação via `AuthProvider`.

```ts
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

| Propriedade | Tipo | Descrição |
|---|---|---|
| `user` | `User \| null` | Usuário autenticado |
| `session` | `Session \| null` | Sessão JWT atual |
| `loading` | `boolean` | Estado inicial de verificação |
| `signIn` | `fn` | Login com email/senha |
| `signUp` | `fn` | Cadastro com metadados extras |
| `signOut` | `fn` | Logout e limpeza de sessão |

### `useUserRole`

Busca o role do usuário autenticado na tabela `user_roles`.

```ts
const { role, isAdmin, isProfessor, isAluno, isLoading } = useUserRole();
```

---

## Como rodar

### Pré-requisitos
- Node.js 18+
- [Expo Go](https://expo.dev/go) instalado no celular (iOS ou Android)
- iPhone/Android na mesma rede Wi-Fi que o computador

### Instalação

```bash
# Clone o repositório
git clone https://github.com/victorrmatos19/racket-pro-app
cd racket-pro-app

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Preencha com suas credenciais do Supabase
```

### Rodando

```bash
npx expo start
```

Escaneie o QR Code com a câmera do iPhone (ou pelo app Expo Go no Android).

Se estiver em redes diferentes (ex: dados móveis):

```bash
npx expo start --tunnel
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> As variáveis com prefixo `EXPO_PUBLIC_` são embutidas no bundle e acessíveis no cliente. **Nunca use a service key aqui.**

O arquivo `.env` está no `.gitignore` e nunca é commitado.

---

## Créditos

Desenvolvido originalmente como aplicação web no [Lovable](https://lovable.dev) e convertido para React Native com Expo.

- Web original: [racket-rookie-tracker](https://github.com/victorrmatos19/racket-rookie-tracker)
- App mobile: [racket-pro-app](https://github.com/victorrmatos19/racket-pro-app)
