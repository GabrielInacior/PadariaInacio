# Database Architecture - Padaria Inácio

## Estrutura Modular

A arquitetura do banco de dados foi refatorada para uma estrutura modular e escalável:

### 📁 Estrutura de Pastas

```
services/database/
├── index.ts                    # DatabaseCore - Conexão e tabelas
├── DatabaseService.ts          # Serviço principal que coordena repositories
├── migrations/
│   ├── index.ts               # MigrationManager
│   └── seeds/
│       ├── users.ts           # Dados iniciais de usuários
│       ├── categorias.ts      # Dados iniciais de categorias
│       ├── produtos.ts        # Dados iniciais de produtos
│       ├── banners.ts         # Dados iniciais de banners
│       └── estoque.ts         # Dados iniciais de estoque
└── repositories/
    ├── index.ts               # Exporta todos os repositories
    ├── UserRepository.ts      # Operações de usuários
    ├── ProductRepository.ts   # Operações de produtos
    ├── CategoryRepository.ts  # Operações de categorias
    └── StockRepository.ts     # Operações de estoque
```

## 🏗️ Componentes Principais

### 1. DatabaseCore (`index.ts`)
- **Responsabilidade**: Conexão com SQLite e criação de tabelas
- **Métodos principais**:
  - `init()`: Inicializa conexão e cria tabelas
  - `getDatabase()`: Retorna instância do banco
  - `resetDatabase()`: Reseta completamente o banco

### 2. MigrationManager (`migrations/index.ts`)
- **Responsabilidade**: Gerencia dados iniciais e migrações
- **Métodos principais**:
  - `runMigrations()`: Executa seeds na ordem correta
  - `resetAndMigrate()`: Reseta e recarrega dados

### 3. Repositories
Cada repository gerencia operações específicas de uma entidade:

#### UserRepository
- `create()`, `findByEmail()`, `findById()`, `findAll()`
- `update()`, `delete()` (soft delete)

#### ProductRepository  
- `findAll()`, `findByCategory()`, `findById()`, `findBySupplier()`
- `create()`, `update()`, `delete()`

#### CategoryRepository
- `findAll()`, `findById()`, `create()`, `update()`, `delete()`

#### StockRepository
- `updateStock()`, `getMovements()`, `getProductsWithStock()`
- `getLowStockProducts()`, `getRecentMovements()`

### 4. DatabaseService (`DatabaseService.ts`)
- **Responsabilidade**: Coordena todos os repositories
- **Interface unificada** para o resto da aplicação
- **Backward compatibility** com a API anterior

## 🔄 Compatibilidade

O arquivo `database.ts` original agora apenas re-exporta o novo `DatabaseService`, mantendo **100% de compatibilidade** com o código existente:

```typescript
// services/database.ts
export { databaseService } from './database/DatabaseService';
```

## 📊 Seeds de Dados

### Usuários (25 total)
- 2 Admins
- 3 Gerentes  
- 5 Funcionários
- 10 Clientes
- 5 Fornecedores

### Categorias (14 total)
- Farinhas, Açúcares, Óleos, Fermentos
- Laticínios, Frutas, Chocolates, Especiarias
- Pães, Doces, Salgados, Bebidas
- Embalagens, Equipamentos

### Produtos (36 total)
- 24 Matérias-primas
- 12 Produtos prontos
- Dados completos: preços, estoque, avaliações

### Banners (4 promocionais)
- Ofertas sazonais
- Produtos orgânicos
- Chocolates premium
- Equipamentos profissionais

## 🚀 Vantagens da Nova Arquitetura

### ✅ Separação de Responsabilidades
- Cada repository gerencia apenas sua entidade
- Migrations separadas do código de negócio
- Core do banco isolado

### ✅ Escalabilidade
- Fácil adição de novos repositories
- Seeds modulares e organizadas
- Estrutura preparada para crescimento

### ✅ Manutenibilidade  
- Código mais limpo e organizado
- Testes unitários mais fáceis
- Debugging simplificado

### ✅ Reutilização
- Repositories podem ser usados independentemente
- Migrations reutilizáveis
- Padrões consistentes

## 🔧 Como Usar

### Importação Simples
```typescript
import { databaseService } from '../services/database';

// Continua funcionando exatamente igual
const user = await databaseService.getUserByEmail('admin@padariainacio.com');
```

### Uso Direto de Repositories (Opcional)
```typescript
import { userRepository, productRepository } from '../services/database/repositories';

const user = await userRepository.findByEmail('admin@padariainacio.com');
const products = await productRepository.findByCategory(1);
```

## 🔍 Troubleshooting

### Problemas de Inicialização
- O sistema automaticamente detecta e corrige problemas
- Fallbacks para tabelas sem colunas específicas
- Reset automático em caso de corrupção

### Logs Detalhados
- Cada operação é logada para debugging
- Erros específicos com contexto
- Progresso de migrations visível

---

**Nota**: Esta refatoração mantém 100% de compatibilidade com o código existente enquanto oferece uma base sólida para futuras expansões. 