import { databaseCore } from '../index';
import { seedUsers } from './seeds/users';
import { seedCategorias } from './seeds/categorias';
import { seedBanners } from './seeds/banners';
import { seedEstoque } from './seeds/estoque';

// Função simples para seed de produtos
async function seedProdutos(db: any): Promise<void> {
  console.log('Seeding produtos...');

  const produtos = [
    {
      nome: 'Pão Francês',
      descricao: 'Pão francês tradicional crocante',
      categoria_id: 9,
      sku: 'PAO-001',
      preco_custo: 0.80,
      preco_venda: 1.50,
      peso: 50,
      destaque: true,
      novo: false,
      tags: '["pão", "francês", "tradicional"]',
      avaliacao_media: 4.7,
      total_avaliacoes: 234,
      total_vendas: 567
    },
    {
      nome: 'Brigadeiro Gourmet',
      descricao: 'Brigadeiro artesanal com chocolate belga',
      categoria_id: 10,
      sku: 'BRI-001',
      preco_custo: 2.50,
      preco_venda: 6.90,
      peso: 25,
      destaque: true,
      novo: false,
      tags: '["brigadeiro", "gourmet", "chocolate belga"]',
      avaliacao_media: 4.9,
      total_avaliacoes: 145,
      total_vendas: 234
    },
    {
      nome: 'Coxinha de Frango',
      descricao: 'Coxinha tradicional com frango desfiado',
      categoria_id: 11,
      sku: 'COX-001',
      preco_custo: 2.80,
      preco_venda: 6.50,
      peso: 120,
      destaque: true,
      novo: false,
      tags: '["coxinha", "frango", "tradicional"]',
      avaliacao_media: 4.7,
      total_avaliacoes: 189,
      total_vendas: 345
    },
    {
      nome: 'Café Expresso',
      descricao: 'Café expresso tradicional encorpado',
      categoria_id: 12,
      sku: 'CAF-001',
      preco_custo: 1.50,
      preco_venda: 4.50,
      peso: 50,
      destaque: true,
      novo: false,
      tags: '["café", "expresso", "encorpado"]',
      avaliacao_media: 4.8,
      total_avaliacoes: 298,
      total_vendas: 456
    },
    {
      nome: 'Farinha de Trigo Premium',
      descricao: 'Farinha especial para panificação profissional',
      categoria_id: 1,
      fornecedor_id: 21,
      sku: 'FAR-001',
      codigo_barras: '7891234567890',
      preco_custo: 3.50,
      preco_venda: 8.90,
      peso: 1000,
      destaque: true,
      novo: false,
      tags: '["farinha", "trigo", "premium"]',
      avaliacao_media: 4.8,
      total_avaliacoes: 45,
      total_vendas: 120
    },
    {
      nome: 'Açúcar Cristal',
      descricao: 'Açúcar cristal refinado especial',
      categoria_id: 2,
      fornecedor_id: 23,
      sku: 'ACU-001',
      codigo_barras: '7891234567893',
      preco_custo: 2.80,
      preco_venda: 6.50,
      peso: 1000,
      destaque: false,
      novo: false,
      tags: '["açúcar", "cristal"]',
      avaliacao_media: 4.5,
      total_avaliacoes: 67,
      total_vendas: 156
    },
    {
      nome: 'Chocolate Meio Amargo',
      descricao: 'Chocolate 70% cacau para confeitaria',
      categoria_id: 7,
      fornecedor_id: 22,
      sku: 'CHO-001',
      codigo_barras: '7891234567904',
      preco_custo: 15.80,
      preco_venda: 32.90,
      peso: 400,
      destaque: true,
      novo: false,
      tags: '["chocolate", "meio amargo", "70% cacau"]',
      avaliacao_media: 4.9,
      total_avaliacoes: 78,
      total_vendas: 112
    },
    {
      nome: 'Trufa de Chocolate',
      descricao: 'Trufa artesanal com recheio cremoso',
      categoria_id: 10,
      sku: 'TRU-001',
      codigo_barras: '7891234567913',
      preco_custo: 3.80,
      preco_venda: 8.90,
      preco_promocional: 7.50,
      peso: 30,
      destaque: true,
      novo: true,
      tags: '["trufa", "chocolate", "artesanal"]',
      avaliacao_media: 4.8,
      total_avaliacoes: 67,
      total_vendas: 123
    },
    {
      nome: 'Pão Integral',
      descricao: 'Pão integral com sementes',
      categoria_id: 9,
      sku: 'PAO-002',
      codigo_barras: '7891234567909',
      preco_custo: 1.20,
      preco_venda: 2.80,
      peso: 80,
      destaque: false,
      novo: false,
      tags: '["pão", "integral", "sementes"]',
      avaliacao_media: 4.6,
      total_avaliacoes: 156,
      total_vendas: 234
    },
    {
      nome: 'Suco de Laranja Natural',
      descricao: 'Suco de laranja natural sem conservantes',
      categoria_id: 12,
      sku: 'SUC-001',
      codigo_barras: '7891234567917',
      preco_custo: 3.20,
      preco_venda: 7.90,
      peso: 300,
      destaque: false,
      novo: true,
      tags: '["suco", "laranja", "natural"]',
      avaliacao_media: 4.6,
      total_avaliacoes: 87,
      total_vendas: 156
    }
  ];

  for (const produto of produtos) {
    const margem = ((produto.preco_venda - produto.preco_custo) / produto.preco_custo) * 100;
    
    await db.runAsync(`
      INSERT INTO produtos (
        nome, descricao, categoria_id, fornecedor_id, sku, codigo_barras,
        preco_custo, preco_venda, preco_promocional, margem_lucro, peso, 
        destaque, novo, tags, avaliacao_media, total_avaliacoes, total_vendas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      produto.nome, produto.descricao, produto.categoria_id, produto.fornecedor_id || null,
      produto.sku, produto.codigo_barras || null, produto.preco_custo, produto.preco_venda,
      produto.preco_promocional || null, margem, produto.peso, 
      produto.destaque || false, produto.novo || false, produto.tags,
      produto.avaliacao_media || 4.5, produto.total_avaliacoes || 0, produto.total_vendas || 0
    ]);
  }

  console.log(`${produtos.length} produtos seeded successfully`);
}

class MigrationManager {
  async runMigrations(): Promise<void> {
    try {
      console.log('Iniciando migrações...');
      
      // Verificar integridade do banco primeiro
      const isIntegrityOk = await databaseCore.checkDatabaseIntegrity();
      
      if (!isIntegrityOk) {
        console.log('Integridade do banco comprometida, resetando...');
        await this.resetAndMigrate();
        return;
      }
      
      // Verificar se há dados suficientes
      const db = await databaseCore.getDatabase();
      
      try {
        const produtoCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM produtos');
        
        if (!produtoCount || produtoCount.count < 10) {
          console.log('Dados insuficientes detectados, resetando banco...');
          await this.resetAndMigrate();
          return;
        }
      } catch (error) {
        console.log('Erro ao verificar dados, resetando banco...', error);
        await this.resetAndMigrate();
        return;
      }
      
      console.log('Migrações concluídas com sucesso');
    } catch (error) {
      console.error('Erro durante migrações:', error);
      throw error;
    }
  }

  async resetAndMigrate(): Promise<void> {
    console.log('Resetting database and running migrations...');
    
    try {
      await databaseCore.resetDatabase();
      await databaseCore.init();
      
      const db = await databaseCore.getDatabase();
      
      // Executar seeds na ordem correta (respeitando foreign keys)
      await seedUsers(db);
      await seedCategorias(db);
      await seedProdutos(db);
      await seedBanners(db);
      await seedEstoque(db);
      
      console.log('Database reset and migrations completed successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}

export const migrationManager = new MigrationManager(); 