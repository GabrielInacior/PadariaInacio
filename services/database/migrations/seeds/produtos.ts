import * as SQLite from 'expo-sqlite';

export async function seedProdutos(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Seeding produtos...');

  const produtos = [
    // FARINHAS (categoria_id: 1)
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
      nome: 'Farinha de Trigo Integral',
      descricao: 'Farinha integral orgânica, rica em fibras',
      categoria_id: 1,
      fornecedor_id: 21,
      sku: 'FAR-002',
      codigo_barras: '7891234567891',
      preco_custo: 4.20,
      preco_venda: 11.50,
      preco_promocional: 9.90,
      peso: 1000,
      destaque: false,
      novo: true,
      tags: '["farinha", "integral", "orgânica"]',
      avaliacao_media: 4.6,
      total_avaliacoes: 32,
      total_vendas: 89
    },
    {
      nome: 'Farinha de Centeio',
      descricao: 'Farinha de centeio para pães especiais',
      categoria_id: 1,
      fornecedor_id: 21,
      sku: 'FAR-003',
      codigo_barras: '7891234567892',
      preco_custo: 5.80,
      preco_venda: 15.90,
      peso: 500,
      destaque: false,
      novo: false,
      tags: '["farinha", "centeio", "especial"]',
      avaliacao_media: 4.4,
      total_avaliacoes: 18,
      total_vendas: 34
    },

    // AÇÚCARES (categoria_id: 2)
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
      nome: 'Açúcar Mascavo Orgânico',
      descricao: 'Açúcar mascavo orgânico não refinado',
      categoria_id: 2,
      fornecedor_id: 23,
      sku: 'ACU-002',
      codigo_barras: '7891234567894',
      preco_custo: 4.50,
      preco_venda: 12.90,
      preco_promocional: 10.90,
      peso: 500,
      destaque: true,
      novo: false,
      tags: '["açúcar", "mascavo", "orgânico"]',
      avaliacao_media: 4.7,
      total_avaliacoes: 41,
      total_vendas: 78
    },

    // ÓLEOS E GORDURAS (categoria_id: 3)
    {
      nome: 'Óleo de Girassol',
      descricao: 'Óleo de girassol refinado para panificação',
      categoria_id: 3,
      fornecedor_id: 22,
      sku: 'OLE-001',
      codigo_barras: '7891234567896',
      preco_custo: 8.50,
      preco_venda: 18.90,
      peso: 900,
      destaque: false,
      novo: false,
      tags: '["óleo", "girassol"]',
      avaliacao_media: 4.3,
      total_avaliacoes: 23,
      total_vendas: 45
    },
    {
      nome: 'Manteiga Sem Sal',
      descricao: 'Manteiga cremosa sem sal para massas',
      categoria_id: 3,
      fornecedor_id: 24,
      sku: 'MAN-001',
      codigo_barras: '7891234567897',
      preco_custo: 12.80,
      preco_venda: 25.90,
      peso: 500,
      destaque: true,
      novo: false,
      tags: '["manteiga", "sem sal", "cremosa"]',
      avaliacao_media: 4.9,
      total_avaliacoes: 56,
      total_vendas: 89
    },

    // FERMENTO E MELHORADORES (categoria_id: 4)
    {
      nome: 'Fermento Biológico Seco',
      descricao: 'Fermento instantâneo para pães',
      categoria_id: 4,
      fornecedor_id: 21,
      sku: 'FER-001',
      codigo_barras: '7891234567898',
      preco_custo: 8.90,
      preco_venda: 18.50,
      peso: 125,
      destaque: false,
      novo: false,
      tags: '["fermento", "biológico", "seco"]',
      avaliacao_media: 4.7,
      total_avaliacoes: 34,
      total_vendas: 78
    },

    // LATICÍNIOS (categoria_id: 5)
    {
      nome: 'Leite Integral',
      descricao: 'Leite integral fresco para receitas',
      categoria_id: 5,
      fornecedor_id: 24,
      sku: 'LEI-001',
      codigo_barras: '7891234567900',
      preco_custo: 3.20,
      preco_venda: 7.50,
      peso: 1000,
      destaque: false,
      novo: false,
      tags: '["leite", "integral", "fresco"]',
      avaliacao_media: 4.5,
      total_avaliacoes: 45,
      total_vendas: 134
    },
    {
      nome: 'Cream Cheese',
      descricao: 'Cream cheese cremoso para recheios',
      categoria_id: 5,
      fornecedor_id: 24,
      sku: 'CRE-001',
      codigo_barras: '7891234567901',
      preco_custo: 8.90,
      preco_venda: 19.90,
      peso: 300,
      destaque: true,
      novo: false,
      tags: '["cream cheese", "cremoso", "recheio"]',
      avaliacao_media: 4.8,
      total_avaliacoes: 67,
      total_vendas: 98
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
      produto.nome, produto.descricao, produto.categoria_id, produto.fornecedor_id,
      produto.sku, produto.codigo_barras, produto.preco_custo, produto.preco_venda,
      produto.preco_promocional || null, margem, produto.peso, 
      produto.destaque || false, produto.novo || false, produto.tags,
      produto.avaliacao_media || 4.5, produto.total_avaliacoes || 0, produto.total_vendas || 0
    ]);
  }

  console.log(`${produtos.length} produtos seeded successfully`);
}
