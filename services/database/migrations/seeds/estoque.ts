import * as SQLite from 'expo-sqlite';

export async function seedEstoque(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Seeding estoque...');

  const estoqueData = [
    { produto_id: 1, quantidade_atual: 450, quantidade_minima: 50, quantidade_maxima: 1000, localizacao: 'A1-B2', lote: 'LT240627' },
    { produto_id: 2, quantidade_atual: 25, quantidade_minima: 20, quantidade_maxima: 200, localizacao: 'A1-B3', lote: 'LT240625' }
  ];

  for (const estoque of estoqueData) {
    await db.runAsync(`
      INSERT INTO estoque (
        produto_id, quantidade_atual, quantidade_minima, quantidade_maxima,
        localizacao_estoque, lote, data_fabricacao, data_validade, custo_medio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      estoque.produto_id, estoque.quantidade_atual, estoque.quantidade_minima,
      estoque.quantidade_maxima, estoque.localizacao, estoque.lote,
      '2024-06-15', '2024-12-15', 3.50
    ]);
  }

  console.log(`${estoqueData.length} estoque records seeded successfully`);
} 