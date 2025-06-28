import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, AuthUser, UserType } from '../types';
import { databaseService } from './database';

const AUTH_TOKEN_KEY = '@padaria_inacio:auth_token';
const AUTH_USER_KEY = '@padaria_inacio:auth_user';

interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: 'cliente' | 'fornecedor' | 'admin' | 'funcionario' | 'gerente';
  telefone?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Tentar carregar usuário salvo
      const savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      const savedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (savedUser && savedToken) {
        const user = JSON.parse(savedUser);
        
        // Verificar se o token ainda é válido
        if (this.validateToken(savedToken, user)) {
          // Verificar se o usuário ainda existe no banco com retry
          try {
            const dbUser = await this.getUserWithRetry(user.id);
            if (dbUser && dbUser.status === 'ativo') {
              this.currentUser = dbUser;
              console.log('Sessão restaurada para:', dbUser.email);
            } else {
              // Usuário não existe mais ou está inativo, limpar sessão
              await this.clearSession();
            }
          } catch (error) {
            console.error('Erro ao verificar usuário no banco:', error);
            // Em caso de erro persistente no banco, limpar sessão
            await this.clearSession();
          }
        } else {
          // Token expirado, limpar sessão
          await this.clearSession();
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar AuthService:', error);
      await this.clearSession(); // Limpar sessão em caso de erro
      this.isInitialized = true; // Continuar mesmo com erro
    }
  }

  private async getUserWithRetry(userId: number, maxRetries: number = 3): Promise<User | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Aguardar um pouco entre tentativas
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
        
        const user = await databaseService.getUserById(userId);
        return user;
      } catch (error) {
        console.error(`Tentativa ${i + 1} de buscar usuário falhou:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
    return null;
  }

  private async clearSession(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  }

  async forceLogout(): Promise<void> {
    console.log('Forçando logout completo...');
    await this.clearSession();
    this.isInitialized = false;
    this.currentUser = null;
    
    // Limpar qualquer cache adicional
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar AsyncStorage:', error);
    }
    
    console.log('Logout forçado concluído');
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const { email, senha } = credentials;
    
    try {
      // Limpar sessão anterior antes de fazer novo login
      await this.clearSession();
      
      // Buscar usuário com retry
      const user = await this.getUserByEmailWithRetry(email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      if (user.senha !== senha) {
        throw new Error('Senha incorreta');
      }
      
      if (user.status !== 'ativo') {
        throw new Error('Conta inativa. Entre em contato com o suporte.');
      }
      
      // Gerar token e salvar sessão
      const token = this.generateToken(user);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      
      this.currentUser = user;
      console.log('Login realizado com sucesso para:', user.email, 'Tipo:', user.tipo);
      
      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      await this.clearSession(); // Limpar sessão em caso de erro
      throw error;
    }
  }

  private async getUserByEmailWithRetry(email: string, maxRetries: number = 3): Promise<User | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Aguardar um pouco entre tentativas
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
        
        const user = await databaseService.getUserByEmail(email);
        return user;
      } catch (error) {
        console.error(`Tentativa ${i + 1} de buscar usuário por email falhou:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
    return null;
  }

  async register(userData: RegisterData): Promise<User> {
    // Verificar se o email já existe
    const existingUser = await databaseService.getUserByEmail(userData.email);
    
    if (existingUser) {
      throw new Error('Este email já está cadastrado');
    }
    
    // Definir nível de acesso baseado no tipo
    const nivelAcesso = userData.tipo === 'admin' ? 5 : 
                      userData.tipo === 'gerente' ? 4 :
                      userData.tipo === 'funcionario' ? 3 :
                      userData.tipo === 'fornecedor' ? 2 : 1;
    
    // Criar novo usuário
    const userId = await databaseService.createUser({
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      tipo: userData.tipo,
      status: 'ativo',
      telefone: userData.telefone,
      data_criacao: new Date().toISOString(),
      nivel_acesso: nivelAcesso,
    });
    
    // Buscar o usuário criado
    const newUser = await databaseService.getUserById(userId);
    
    if (!newUser) {
      throw new Error('Erro ao criar usuário');
    }
    
    // Gerar token e salvar sessão
    const token = this.generateToken(newUser);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    
    this.currentUser = newUser;
    return newUser;
  }

  async logout(): Promise<void> {
    console.log('Fazendo logout do usuário:', this.currentUser?.email);
    await this.clearSession();
    
    // Forçar reinicialização do serviço
    this.isInitialized = false;
    this.currentUser = null;
    
    console.log('Logout concluído, sessão completamente limpa');
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.init();
    }
    
    // Verificar se há usuário e token válidos
    if (!this.currentUser) {
      return false;
    }
    
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      
      if (!token || !savedUser) {
        this.currentUser = null;
        return false;
      }
      
      // Validar token
      const user = JSON.parse(savedUser);
      if (!this.validateToken(token, user)) {
        await this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      await this.clearSession();
      return false;
    }
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  private generateToken(user: User): string {
    // Em produção, usar JWT com chave secreta
    const timestamp = Date.now();
    const payload = {
      userId: user.id,
      email: user.email,
      tipo: user.tipo,
      timestamp
    };
    
    return btoa(JSON.stringify(payload));
  }

  private validateToken(token: string, user: User): boolean {
    try {
      const payload = JSON.parse(atob(token));
      
      // Verificar se o token pertence ao usuário
      if (payload.userId !== user.id || payload.email !== user.email) {
        return false;
      }

      // Verificar se o token não expirou (7 dias)
      const tokenAge = Date.now() - payload.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em millisegundos
      
      return tokenAge < maxAge;
    } catch (error) {
      return false;
    }
  }

  async refreshUserData(): Promise<User | null> {
    if (!this.currentUser) return null;

    try {
      const updatedUser = await databaseService.getUserById(this.currentUser.id);
      if (updatedUser) {
        this.currentUser = updatedUser;
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (error) {
      console.error('Refresh user data error:', error);
      return null;
    }
  }

  getUserType(): UserType | null {
    return this.currentUser?.tipo || null;
  }

  isAdmin(): boolean {
    return this.currentUser?.tipo === 'admin';
  }

  isCliente(): boolean {
    return this.currentUser?.tipo === 'cliente';
  }

  isFornecedor(): boolean {
    return this.currentUser?.tipo === 'fornecedor';
  }
}

export const authService = new AuthService(); 