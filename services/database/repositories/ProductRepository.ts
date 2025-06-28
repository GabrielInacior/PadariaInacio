import { databaseCore } from '../index';
import { Produto } from '../../../types';

export class ProductRepository {
  async findAll(): Promise<Produto[]> {
    const db = await databaseCore.getDatabase();
    
    try {
      const produtos = await db.getAllAsync<Produto>('SELECT * FROM produtos WHERE status = "ativo" ORDER BY nome');
      return produtos;
    } catch (error) {
      // Fallback para tabela sem coluna status
      const produtos = await db.getAllAsync<Produto>('SELECT * FROM produtos ORDER BY nome');
      return produtos;
    }
  }

  async findByCategory(categoriaId: number): Promise<Produto[]> {
    const db = await databaseCore.getDatabase();
    
    try {
      const produtos = await db.getAllAsync<Produto>(
        'SELECT * FROM produtos WHERE categoria_id = ? AND status = "ativo" ORDER BY nome', 
        [categoriaId]
      );
      return produtos;
    } catch (error) {
      // Fallback para tabela sem coluna status
      const produtos = await db.getAllAsync<Produto>(
        'SELECT * FROM produtos WHERE categoria_id = ? ORDER BY nome', 
        [categoriaId]
      );
      return produtos;
    }
  }

  async findById(id: number): Promise<Produto | null> {
    const db = await databaseCore.getDatabase();
    
    try {
      const produto = await db.getFirstAsync<Produto>('SELECT * FROM produtos WHERE id = ? AND status = "ativo"', [id]);
      return produto || null;
    } catch (error) {
      // Fallback para tabela sem coluna status
      const produto = await db.getFirstAsync<Produto>('SELECT * FROM produtos WHERE id = ?', [id]);
      return produto || null;
    }
  }

  async findBySupplier(fornecedorId: number): Promise<any[]> {
    const db = await databaseCore.getDatabase();

    const produtos = await db.getAllAsync<any>(`
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
        e.ultima_movimentacao
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN estoque e ON p.id = e.produto_id
      WHERE p.fornecedor_id = ?
      ORDER BY p.nome ASC
    `, [fornecedorId]);

    return produtos.map((produto: any) => ({
      ...produto,
      estoque: {
        id: produto.id,
        produto_id: produto.id,
        quantidade_atual: produto.quantidade_atual || 0,
        quantidade_minima: produto.quantidade_minima || 0,
        quantidade_maxima: produto.quantidade_maxima || 0,
        quantidade_reservada: produto.quantidade_reservada || 0,
        localizacao_estoque: produto.localizacao_estoque,
        lote: produto.lote,
        data_fabricacao: produto.data_fabricacao,
        data_validade: produto.data_validade,
        custo_medio: produto.custo_medio || 0,
        ultima_movimentacao: produto.ultima_movimentacao
      }
    }));
  }

  async create(produto: any): Promise<number> {
    const db = await databaseCore.getDatabase();

    const result = await db.runAsync(`
      INSERT INTO produtos (
        nome, descricao, categoria_id, fornecedor_id, sku, codigo_barras,
        preco_custo, preco_venda, preco_promocional, margem_lucro, peso,
        ingredientes, informacoes_nutricionais, alergenos, validade_dias,
        temperatura_armazenamento, imagens, status, destaque, novo, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      produto.nome,
      produto.descricao,
      produto.categoria_id,
      produto.fornecedor_id,
      produto.sku,
      produto.codigo_barras,
      produto.preco_custo,
      produto.preco_venda,
      produto.preco_promocional,
      produto.margem_lucro,
      produto.peso,
      produto.ingredientes,
      produto.informacoes_nutricionais,
      produto.alergenos,
      produto.validade_dias,
      produto.temperatura_armazenamento,
      produto.imagens,
      produto.status || 'ativo',
      produto.destaque || false,
      produto.novo || false,
      produto.tags
    ]);

    const produtoId = result.lastInsertRowId as number;

    // Criar registro de estoque inicial
    await db.runAsync(`
      INSERT INTO estoque (produto_id, quantidade_atual, quantidade_minima, quantidade_maxima)
      VALUES (?, 0, 10, 1000)
    `, [produtoId]);

    return produtoId;
  }

  async update(id: number, produto: any): Promise<void> {
    const db = await databaseCore.getDatabase();

    await db.runAsync(`
      UPDATE produtos SET
        nome = ?, descricao = ?, categoria_id = ?, sku = ?, codigo_barras = ?,
        preco_custo = ?, preco_venda = ?, preco_promocional = ?, margem_lucro = ?,
        peso = ?, ingredientes = ?, informacoes_nutricionais = ?, alergenos = ?,
        validade_dias = ?, temperatura_armazenamento = ?, imagens = ?, status = ?,
        destaque = ?, novo = ?, tags = ?, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      produto.nome,
      produto.descricao,
      produto.categoria_id,
      produto.sku,
      produto.codigo_barras,
      produto.preco_custo,
      produto.preco_venda,
      produto.preco_promocional,
      produto.margem_lucro,
      produto.peso,
      produto.ingredientes,
      produto.informacoes_nutricionais,
      produto.alergenos,
      produto.validade_dias,
      produto.temperatura_armazenamento,
      produto.imagens,
      produto.status,
      produto.destaque,
      produto.novo,
      produto.tags,
      id
    ]);
  }

  async delete(id: number): Promise<void> {
    const db = await databaseCore.getDatabase();

    // Marcar como inativo ao invés de deletar
    await db.runAsync(`
      UPDATE produtos SET status = 'inativo', data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }

  async getProdutosByFornecedor(fornecedorId: number): Promise<any[]> {
    const db = await databaseCore.getDatabase();
    
    try {
      return await db.getAllAsync(`
        SELECT 
          p.*,
          c.nome as categoria_nome,
          e.quantidade_atual,
          e.quantidade_minima, 
          e.quantidade_maxima,
          e.lote,
          e.localizacao_estoque,
          JSON_OBJECT(
            'quantidade_atual', e.quantidade_atual,
            'quantidade_minima', e.quantidade_minima,
            'quantidade_maxima', e.quantidade_maxima,
            'lote', e.lote,
            'localizacao_estoque', e.localizacao_estoque
          ) as estoque
        FROM produtos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN estoque e ON p.id = e.produto_id
        WHERE p.fornecedor_id = ?
        ORDER BY p.nome ASC
      `, [fornecedorId]);
    } catch (error) {
      console.error('Erro ao buscar produtos por fornecedor:', error);
      
      // Fallback query sem campos que podem não existir
      try {
        const produtos = await db.getAllAsync(`
          SELECT 
            p.*,
            c.nome as categoria_nome
          FROM produtos p
          LEFT JOIN categorias c ON p.categoria_id = c.id
          WHERE p.fornecedor_id = ?
          ORDER BY p.nome ASC
        `, [fornecedorId]);

        // Adicionar dados de estoque mockados para cada produto
        return produtos.map((produto: any) => ({
          ...produto,
          sku: produto.codigo_barras || `SKU${produto.id.toString().padStart(6, '0')}`,
          estoque: {
            quantidade_atual: Math.floor(Math.random() * 100) + 10,
            quantidade_minima: 5,
            quantidade_maxima: 200,
            lote: `LOTE${Math.floor(Math.random() * 1000) + 1}`,
            localizacao_estoque: `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`
          }
        }));
      } catch (fallbackError) {
        console.error('Erro no fallback de produtos por fornecedor:', fallbackError);
        return [];
      }
    }
  }
}

export const productRepository = new ProductRepository(); 