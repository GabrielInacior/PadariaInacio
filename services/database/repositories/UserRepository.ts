import { databaseCore } from '../index';
import { User } from '../../../types';

export class UserRepository {
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = await databaseCore.getDatabase();
    
    const result = await db.runAsync(`
      INSERT INTO users (nome, email, senha, tipo, status, telefone, foto_perfil) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      user.nome, 
      user.email, 
      user.senha, 
      user.tipo,
      user.status || 'ativo',
      user.telefone || null,
      user.foto_perfil || null
    ]);
    
    return result.lastInsertRowId;
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const db = await databaseCore.getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      const user = await db.getFirstAsync<User>(
        'SELECT * FROM users WHERE email = ? AND status = "ativo"', 
        [email]
      );
      
      return user || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      
      // Se for erro de conexão, tentar reinicializar o banco
      if (error instanceof Error && (
          error.message.includes('NullPointerException') || 
          error.message.includes('database') || 
          error.message.includes('connection'))) {
        try {
          console.log('Tentando reinicializar banco devido a erro de conexão...');
          await databaseCore.resetDatabase();
          await databaseCore.init();
          
          // Tentar novamente após reinicialização
          const db = await databaseCore.getDatabase();
          const user = await db.getFirstAsync<User>(
            'SELECT * FROM users WHERE email = ? AND status = "ativo"', 
            [email]
          );
          
          return user || null;
        } catch (retryError) {
          console.error('Erro ao reinicializar banco:', retryError);
          throw new Error('Erro de conexão com banco de dados');
        }
      }
      
      throw error;
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      const db = await databaseCore.getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      const user = await db.getFirstAsync<User>(
        'SELECT * FROM users WHERE id = ?', 
        [id]
      );
      
      return user || null;
    } catch (error) {
      console.error('Error in findById:', error);
      
      // Se for erro de conexão, tentar reinicializar o banco
      if (error instanceof Error && (
          error.message.includes('NullPointerException') || 
          error.message.includes('database') || 
          error.message.includes('connection'))) {
        try {
          console.log('Tentando reinicializar banco devido a erro de conexão...');
          await databaseCore.resetDatabase();
          await databaseCore.init();
          
          // Tentar novamente após reinicialização
          const db = await databaseCore.getDatabase();
          const user = await db.getFirstAsync<User>(
            'SELECT * FROM users WHERE id = ?', 
            [id]
          );
          
          return user || null;
        } catch (retryError) {
          console.error('Erro ao reinicializar banco:', retryError);
          throw new Error('Erro de conexão com banco de dados');
        }
      }
      
      throw error;
    }
  }

  async findAll(tipo?: string): Promise<User[]> {
    const db = await databaseCore.getDatabase();

    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];

    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY nome ASC';

    return await db.getAllAsync<User>(query, params);
  }

  async update(id: number, userData: Partial<User>): Promise<void> {
    const db = await databaseCore.getDatabase();

    await db.runAsync(`
      UPDATE users SET
        nome = ?, email = ?, telefone = ?, status = ?, 
        data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userData.nome || '', userData.email || '', userData.telefone || null, userData.status || 'ativo', id]);
  }

  async delete(id: number): Promise<void> {
    const db = await databaseCore.getDatabase();

    // Marcar como inativo ao invés de deletar
    await db.runAsync(`
      UPDATE users SET status = 'inativo', data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
  }
}

export const userRepository = new UserRepository(); 