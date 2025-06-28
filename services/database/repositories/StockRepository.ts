import { databaseCore } from '../index';

export class StockRepository {
  async updateStock(
    produtoId: number,
    quantidade: number,
    tipoMovimento: 'entrada' | 'saida',
    observacoes: string = '',
    usuarioId: number = 1
  ): Promise<void> {
    const db = await databaseCore.getDatabase();

    // Buscar quantidade atual
    const estoqueAtual = await db.getFirstAsync<{ quantidade_atual: number }>(`
      SELECT quantidade_atual FROM estoque WHERE produto_id = ?
    `, [produtoId]);

    const quantidadeAnterior = estoqueAtual?.quantidade_atual || 0;
    let novaQuantidade = quantidadeAnterior;

    switch (tipoMovimento) {
      case 'entrada':
        novaQuantidade = quantidadeAnterior + quantidade;
        break;
      case 'saida':
        novaQuantidade = Math.max(0, quantidadeAnterior - quantidade);
        break;
    }

    // Atualizar estoque
    await db.runAsync(`
      UPDATE estoque SET 
        quantidade_atual = ?, 
        ultima_movimentacao = CURRENT_TIMESTAMP
      WHERE produto_id = ?
    `, [novaQuantidade, produtoId]);

    // Registrar movimentação
    await db.runAsync(`
      INSERT INTO movimentacao_estoque (
        produto_id, tipo, quantidade, quantidade_anterior, motivo, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [produtoId, tipoMovimento, quantidade, quantidadeAnterior, observacoes, usuarioId]);
  }

  async getMovements(produtoId?: number): Promise<any[]> {
    const db = await databaseCore.getDatabase();
    
    if (produtoId) {
      return await db.getAllAsync(`
        SELECT 
          m.*,
          p.nome as produto_nome,
          u.nome as usuario_nome
        FROM movimentacoes_estoque m
        JOIN produtos p ON m.produto_id = p.id
        LEFT JOIN users u ON m.usuario_id = u.id
        WHERE m.produto_id = ?
        ORDER BY m.data_movimentacao DESC
      `, [produtoId]);
    } else {
      return await db.getAllAsync(`
        SELECT 
          m.*,
          p.nome as produto_nome,
          u.nome as usuario_nome
        FROM movimentacoes_estoque m
        JOIN produtos p ON m.produto_id = p.id
        LEFT JOIN users u ON m.usuario_id = u.id
        ORDER BY m.data_movimentacao DESC
      `);
    }
  }

  async getProductsWithStock(): Promise<any[]> {
    const db = await databaseCore.getDatabase();

    try {
      return await db.getAllAsync(`
        SELECT 
          p.*,
          c.nome as categoria_nome,
          e.quantidade_atual,
          e.quantidade_minima,
          e.quantidade_maxima,
          e.quantidade_reservada,
          e.localizacao_estoque,
          e.lote,
          e.data_fabricacao,
          e.data_validade,
          e.custo_medio,
          e.ultima_movimentacao,
          CASE 
            WHEN e.quantidade_atual <= e.quantidade_minima THEN 'baixo'
            WHEN e.quantidade_atual >= e.quantidade_maxima * 0.8 THEN 'alto'
            ELSE 'normal'
          END as status_estoque
        FROM produtos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN estoque e ON p.id = e.produto_id
        WHERE p.status = 'ativo'
        ORDER BY p.nome ASC
      `);
    } catch (error) {
      // Fallback para tabela sem coluna status
      return await db.getAllAsync(`
        SELECT 
          p.*,
          c.nome as categoria_nome,
          e.quantidade_atual,
          e.quantidade_minima,
          e.quantidade_maxima,
          e.quantidade_reservada,
          e.localizacao_estoque,
          e.lote,
          e.data_fabricacao,
          e.data_validade,
          e.custo_medio,
          e.ultima_movimentacao,
          CASE 
            WHEN e.quantidade_atual <= e.quantidade_minima THEN 'baixo'
            WHEN e.quantidade_atual >= e.quantidade_maxima * 0.8 THEN 'alto'
            ELSE 'normal'
          END as status_estoque
        FROM produtos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN estoque e ON p.id = e.produto_id
        ORDER BY p.nome ASC
      `);
    }
  }

  async getLowStockProducts(): Promise<any[]> {
    const db = await databaseCore.getDatabase();

    try {
      return await db.getAllAsync(`
        SELECT 
          p.*,
          c.nome as categoria_nome,
          e.quantidade_atual,
          e.quantidade_minima,
          e.quantidade_maxima
        FROM produtos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN estoque e ON p.id = e.produto_id
        WHERE p.status = 'ativo' AND e.quantidade_atual <= e.quantidade_minima
        ORDER BY e.quantidade_atual ASC
      `);
    } catch (error) {
      // Fallback para tabela sem coluna status
      return await db.getAllAsync(`
        SELECT 
          p.*,
          c.nome as categoria_nome,
          e.quantidade_atual,
          e.quantidade_minima,
          e.quantidade_maxima
        FROM produtos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN estoque e ON p.id = e.produto_id
        WHERE e.quantidade_atual <= e.quantidade_minima
        ORDER BY e.quantidade_atual ASC
      `);
    }
  }

  async getRecentMovements(limit: number = 50): Promise<any[]> {
    const db = await databaseCore.getDatabase();

    return await db.getAllAsync(`
      SELECT 
        m.*,
        p.nome as produto_nome,
        p.sku,
        u.nome as usuario_nome,
        c.nome as categoria_nome
      FROM movimentacao_estoque m
      LEFT JOIN produtos p ON m.produto_id = p.id
      LEFT JOIN users u ON m.usuario_id = u.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY m.data_movimentacao DESC
      LIMIT ?
    `, [limit]);
  }

  async findAll(): Promise<any[]> {
    const db = await databaseCore.getDatabase();
    
    try {
      return await db.getAllAsync(`
        SELECT 
          e.*,
          p.nome as produto_nome,
          p.sku,
          c.nome as categoria_nome
        FROM estoque e
        JOIN produtos p ON e.produto_id = p.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        ORDER BY p.nome ASC
      `);
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      return [];
    }
  }
}

export const stockRepository = new StockRepository(); 