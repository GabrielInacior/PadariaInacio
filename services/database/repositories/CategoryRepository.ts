import { databaseCore } from '../index';
import { Categoria } from '../../../types';

export class CategoryRepository {
  async findAll(): Promise<Categoria[]> {
    const db = await databaseCore.getDatabase();
    
    try {
      const categorias = await db.getAllAsync<Categoria>('SELECT * FROM categorias WHERE ativo = 1 ORDER BY nome');
      return categorias;
    } catch (error) {
      // Fallback caso a coluna ativo não exista
      const categorias = await db.getAllAsync<Categoria>('SELECT * FROM categorias ORDER BY nome');
      return categorias;
    }
  }

  async findById(id: number): Promise<Categoria | null> {
    const db = await databaseCore.getDatabase();
    
    const categoria = await db.getFirstAsync<Categoria>('SELECT * FROM categorias WHERE id = ?', [id]);
    return categoria || null;
  }

  async create(categoria: Omit<Categoria, 'id'>): Promise<number> {
    const db = await databaseCore.getDatabase();
    
    const result = await db.runAsync(`
      INSERT INTO categorias (nome, descricao, icone, cor_tema, ordem_exibicao, ativo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      categoria.nome, 
      categoria.descricao || null, 
      categoria.icone || null, 
      categoria.cor_tema || null, 
      categoria.ordem_exibicao || 0, 
      categoria.ativo !== false
    ]);
    
    return result.lastInsertRowId;
  }

  async update(id: number, categoria: Partial<Categoria>): Promise<void> {
    const db = await databaseCore.getDatabase();

    await db.runAsync(`
      UPDATE categorias SET
        nome = ?, descricao = ?, icone = ?, cor_tema = ?, ordem_exibicao = ?, ativo = ?
      WHERE id = ?
    `, [
      categoria.nome || '', 
      categoria.descricao || null, 
      categoria.icone || null, 
      categoria.cor_tema || null, 
      categoria.ordem_exibicao || 0, 
      categoria.ativo !== false, 
      id
    ]);
  }

  async delete(id: number): Promise<void> {
    const db = await databaseCore.getDatabase();

    // Marcar como inativo ao invés de deletar
    await db.runAsync(`
      UPDATE categorias SET ativo = 0 WHERE id = ?
    `, [id]);
  }
}

export const categoryRepository = new CategoryRepository(); 