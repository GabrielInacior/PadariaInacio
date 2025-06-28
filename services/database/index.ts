import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'padaria_inacio.db';

class DatabaseCore {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
      this.isInitialized = true;
      console.log('Database core initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.init();
    }
    
    // Verificar se a conexão ainda está válida
    try {
      await this.db!.getFirstAsync('SELECT 1');
      return this.db!;
    } catch (error) {
      console.warn('Conexão com banco perdida, reinicializando...', error);
      await this.init();
      return this.db!;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      console.log('Database not initialized, reinitializing...');
      await this.init();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de usuários
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'fornecedor', 'admin', 'funcionario', 'gerente')),
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso', 'pendente')),
        telefone TEXT,
        endereco TEXT,
        cpf TEXT,
        cnpj TEXT,
        razao_social TEXT,
        nome_fantasia TEXT,
        categoria_fornecedor TEXT,
        avaliacao_media REAL DEFAULT 0,
        status_aprovacao TEXT DEFAULT 'aprovado' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
        dataNascimento TEXT,
        foto TEXT,
        salario REAL,
        cargo TEXT,
        dataAdmissao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acesso DATETIME,
        nivel_acesso INTEGER DEFAULT 1,
        pontos_fidelidade INTEGER DEFAULT 0,
        nivel_fidelidade TEXT DEFAULT 'bronze'
      );
    `);

    // Tabela de categorias
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria_pai_id INTEGER,
        icone TEXT,
        cor_tema TEXT,
        ativo BOOLEAN DEFAULT 1,
        ordem_exibicao INTEGER DEFAULT 0,
        FOREIGN KEY (categoria_pai_id) REFERENCES categorias (id)
      );
    `);

    // Tabela de produtos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria_id INTEGER NOT NULL,
        fornecedor_id INTEGER,
        sku TEXT UNIQUE NOT NULL,
        codigo_barras TEXT,
        preco_custo REAL NOT NULL,
        preco_venda REAL NOT NULL,
        preco_promocional REAL,
        margem_lucro REAL DEFAULT 0,
        peso REAL,
        dimensoes TEXT,
        ingredientes TEXT,
        informacoes_nutricionais TEXT,
        alergenos TEXT,
        validade_dias INTEGER,
        temperatura_armazenamento TEXT,
        imagens TEXT,
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
        destaque BOOLEAN DEFAULT 0,
        novo BOOLEAN DEFAULT 0,
        avaliacao_media REAL DEFAULT 0,
        total_avaliacoes INTEGER DEFAULT 0,
        total_vendas INTEGER DEFAULT 0,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        seo_titulo TEXT,
        seo_descricao TEXT,
        tags TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id),
        FOREIGN KEY (fornecedor_id) REFERENCES users (id)
      );
    `);

    // Tabela de estoque
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        quantidade_atual INTEGER DEFAULT 0,
        quantidade_minima INTEGER DEFAULT 10,
        quantidade_maxima INTEGER DEFAULT 1000,
        quantidade_reservada INTEGER DEFAULT 0,
        localizacao_estoque TEXT,
        lote TEXT,
        data_fabricacao TEXT,
        data_validade TEXT,
        custo_medio REAL DEFAULT 0,
        ultima_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
      );
    `);

    // Tabela de movimentação de estoque
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS movimentacao_estoque (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'transferencia')),
        quantidade INTEGER NOT NULL,
        quantidade_anterior INTEGER NOT NULL,
        motivo TEXT NOT NULL,
        documento_referencia TEXT,
        usuario_id INTEGER NOT NULL,
        fornecedor_id INTEGER,
        data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        observacoes TEXT,
        FOREIGN KEY (produto_id) REFERENCES produtos (id),
        FOREIGN KEY (usuario_id) REFERENCES users (id),
        FOREIGN KEY (fornecedor_id) REFERENCES users (id)
      );
    `);

    // Tabela de banners
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        imagem TEXT NOT NULL,
        link TEXT,
        ativo BOOLEAN DEFAULT 1,
        ordem INTEGER DEFAULT 0,
        data_inicio TEXT,
        data_fim TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de carrinho
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS carrinho (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        total REAL DEFAULT 0,
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'cancelado')),
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES users (id)
      );
    `);

    // Tabela de itens do carrinho
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS itens_carrinho (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carrinho_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        observacoes TEXT,
        FOREIGN KEY (carrinho_id) REFERENCES carrinho (id),
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
      );
    `);

    // Tabela de pedidos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_pedido TEXT UNIQUE NOT NULL,
        cliente_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pendente' CHECK (status IN ('carrinho', 'pendente', 'confirmado', 'preparando', 'pronto', 'entregue', 'cancelado')),
        tipo TEXT DEFAULT 'balcao' CHECK (tipo IN ('balcao', 'delivery', 'retirada', 'online')),
        subtotal REAL NOT NULL,
        desconto REAL DEFAULT 0,
        taxa_entrega REAL DEFAULT 0,
        total REAL NOT NULL,
        forma_pagamento TEXT,
        status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'aprovado', 'rejeitado', 'estornado')),
        endereco_entrega TEXT,
        previsao_entrega TEXT,
        observacoes TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES users (id)
      );
    `);

    // Tabela de itens do pedido
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        preco_total REAL NOT NULL,
        observacoes TEXT,
        FOREIGN KEY (pedido_id) REFERENCES pedidos (id),
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
      );
    `);

    // Tabela de notificações
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('pedido', 'promocao', 'sistema', 'entrega', 'pagamento', 'estoque', 'usuario', 'produto', 'fidelidade', 'financeiro')),
        lida INTEGER DEFAULT 0 CHECK (lida IN (0, 1)),
        data_criacao TEXT NOT NULL,
        data_leitura TEXT,
        dados_extras TEXT,
        push_enviado INTEGER DEFAULT 0 CHECK (push_enviado IN (0, 1)),
        email_enviado INTEGER DEFAULT 0 CHECK (email_enviado IN (0, 1)),
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Índices para otimização das consultas de notificações
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notificacoes_data_criacao ON notificacoes(data_criacao);
    `);

    console.log('All tables created successfully');
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Deletar todas as tabelas
      await this.db.execAsync('DROP TABLE IF EXISTS movimentacao_estoque');
      await this.db.execAsync('DROP TABLE IF EXISTS estoque');
      await this.db.execAsync('DROP TABLE IF EXISTS itens_pedido');
      await this.db.execAsync('DROP TABLE IF EXISTS pedidos');
      await this.db.execAsync('DROP TABLE IF EXISTS itens_carrinho');
      await this.db.execAsync('DROP TABLE IF EXISTS carrinho');
      await this.db.execAsync('DROP TABLE IF EXISTS banners');
      await this.db.execAsync('DROP TABLE IF EXISTS produtos');
      await this.db.execAsync('DROP TABLE IF EXISTS categorias');
      await this.db.execAsync('DROP TABLE IF EXISTS users');

      // Recriar tabelas
      await this.createTables();
      this.isInitialized = true;
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async checkDatabaseIntegrity(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      
      // Verificar se as tabelas principais existem
      const tables = await db.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'produtos', 'categorias', 'estoque')
      `);
      
      return tables.length >= 4;
    } catch (error) {
      console.error('Erro ao verificar integridade do banco:', error);
      return false;
    }
  }
}

export const databaseCore = new DatabaseCore(); 