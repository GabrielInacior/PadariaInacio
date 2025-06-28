import { databaseService } from '../database';
import { Notificacao } from '../../types';

export interface NotificationConfig {
  admin: {
    pedido: { titulo: string; icone: string; cor: string };
    estoque: { titulo: string; icone: string; cor: string };
    usuario: { titulo: string; icone: string; cor: string };
    sistema: { titulo: string; icone: string; cor: string };
    financeiro: { titulo: string; icone: string; cor: string };
  };
  cliente: {
    pedido: { titulo: string; icone: string; cor: string };
    promocao: { titulo: string; icone: string; cor: string };
    entrega: { titulo: string; icone: string; cor: string };
    fidelidade: { titulo: string; icone: string; cor: string };
    sistema: { titulo: string; icone: string; cor: string };
  };
  fornecedor: {
    pedido: { titulo: string; icone: string; cor: string };
    produto: { titulo: string; icone: string; cor: string };
    estoque: { titulo: string; icone: string; cor: string };
    pagamento: { titulo: string; icone: string; cor: string };
    sistema: { titulo: string; icone: string; cor: string };
  };
}

class NotificationService {
  private notificationConfig: NotificationConfig = {
    admin: {
      pedido: { titulo: 'Novos Pedidos', icone: 'receipt', cor: '#f39c12' },
      estoque: { titulo: 'Alertas de Estoque', icone: 'warning', cor: '#e74c3c' },
      usuario: { titulo: 'Gestão de Usuários', icone: 'people', cor: '#3498db' },
      sistema: { titulo: 'Sistema', icone: 'settings', cor: '#95a5a6' },
      financeiro: { titulo: 'Financeiro', icone: 'cash', cor: '#27ae60' },
    },
    cliente: {
      pedido: { titulo: 'Seus Pedidos', icone: 'bag', cor: '#3498db' },
      promocao: { titulo: 'Promoções', icone: 'pricetag', cor: '#e74c3c' },
      entrega: { titulo: 'Entregas', icone: 'car', cor: '#f39c12' },
      fidelidade: { titulo: 'Fidelidade', icone: 'gift', cor: '#9b59b6' },
      sistema: { titulo: 'Avisos', icone: 'information-circle', cor: '#95a5a6' },
    },
    fornecedor: {
      pedido: { titulo: 'Pedidos', icone: 'clipboard', cor: '#3498db' },
      produto: { titulo: 'Produtos', icone: 'cube', cor: '#2ecc71' },
      estoque: { titulo: 'Estoque', icone: 'layers', cor: '#f39c12' },
      pagamento: { titulo: 'Pagamentos', icone: 'card', cor: '#27ae60' },
      sistema: { titulo: 'Sistema', icone: 'cog', cor: '#95a5a6' },
    },
  };

  // Criar nova notificação
  async createNotification(
    usuarioId: number,
    tipo: string,
    titulo: string,
    mensagem: string,
    dadosExtras?: any
  ): Promise<void> {
    try {
      const notification = {
        usuario_id: usuarioId,
        titulo,
        mensagem,
        tipo,
        lida: false,
        data_criacao: new Date().toISOString(),
        dados_extras: dadosExtras ? JSON.stringify(dadosExtras) : null,
        push_enviado: false,
        email_enviado: false,
      };

      await databaseService.createNotification(notification);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  // Buscar notificações por usuário
  async getNotificationsByUser(usuarioId: number, limit: number = 20): Promise<Notificacao[]> {
    try {
      return await databaseService.getNotificationsByUser(usuarioId, limit);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  // Contar notificações não lidas
  async getUnreadCount(usuarioId: number): Promise<number> {
    try {
      return await databaseService.getUnreadNotificationsCount(usuarioId);
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await databaseService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(usuarioId: number): Promise<void> {
    try {
      await databaseService.markAllNotificationsAsRead(usuarioId);
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  }

  // Excluir notificação
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await databaseService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  }

  // Gerar notificações específicas por tipo de usuário

  // ADMIN NOTIFICATIONS
  async notifyAdminNewOrder(pedidoId: number): Promise<void> {
    const admins = await databaseService.getUsuarios('admin');
    
    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'pedido',
        'Novo Pedido Recebido',
        `Um novo pedido (#${pedidoId}) foi recebido e aguarda confirmação.`,
        { pedido_id: pedidoId, action: 'view_order' }
      );
    }
  }

  async notifyAdminLowStock(produtoNome: string, quantidade: number): Promise<void> {
    const admins = await databaseService.getUsuarios('admin');
    
    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'estoque',
        'Estoque Baixo',
        `O produto "${produtoNome}" está com estoque baixo (${quantidade} unidades).`,
        { tipo: 'estoque_baixo', produto: produtoNome }
      );
    }
  }

  async notifyAdminNewUser(userType: string, userName: string): Promise<void> {
    const admins = await databaseService.getUsuarios('admin');
    
    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'usuario',
        'Novo Usuário Cadastrado',
        `Um novo ${userType} "${userName}" se cadastrou na plataforma.`,
        { tipo: 'novo_usuario', user_type: userType }
      );
    }
  }

  // CLIENT NOTIFICATIONS
  async notifyClientOrderStatus(clienteId: number, pedidoId: number, status: string): Promise<void> {
    const statusMessages = {
      'confirmado': 'Seu pedido foi confirmado e está sendo preparado.',
      'em_preparo': 'Seu pedido está sendo preparado com carinho.',
      'pronto': 'Seu pedido está pronto! Pode vir buscar.',
      'entregue': 'Seu pedido foi entregue com sucesso.',
      'cancelado': 'Seu pedido foi cancelado. Entre em contato para mais informações.'
    };

    await this.createNotification(
      clienteId,
      'pedido',
      `Pedido ${status === 'confirmado' ? 'Confirmado' : status === 'em_preparo' ? 'Em Preparo' : status === 'pronto' ? 'Pronto' : status === 'entregue' ? 'Entregue' : 'Cancelado'}`,
      statusMessages[status as keyof typeof statusMessages] || `Status do pedido atualizado para: ${status}`,
      { pedido_id: pedidoId, status, action: 'view_order' }
    );
  }

  async notifyClientPromotion(clienteId: number, promocaoTitulo: string, desconto: string): Promise<void> {
    await this.createNotification(
      clienteId,
      'promocao',
      'Nova Promoção Disponível!',
      `${promocaoTitulo} - ${desconto} de desconto! Não perca esta oportunidade.`,
      { tipo: 'promocao', action: 'view_products' }
    );
  }

  async notifyClientLoyalty(clienteId: number, pontos: number, nivel?: string): Promise<void> {
    await this.createNotification(
      clienteId,
      'fidelidade',
      nivel ? 'Novo Nível Alcançado!' : 'Pontos de Fidelidade',
      nivel 
        ? `Parabéns! Você alcançou o nível ${nivel} e ganhou ${pontos} pontos extras!`
        : `Você ganhou ${pontos} pontos de fidelidade!`,
      { pontos, nivel, action: 'view_loyalty' }
    );
  }

  // SUPPLIER NOTIFICATIONS
  async notifySupplierNewOrder(fornecedorId: number, pedidoId: number, total: number): Promise<void> {
    await this.createNotification(
      fornecedorId,
      'pedido',
      'Novo Pedido de Produtos',
      `Você recebeu um novo pedido no valor de R$ ${total.toFixed(2)}.`,
      { pedido_id: pedidoId, total, action: 'view_order' }
    );
  }

  async notifySupplierPayment(fornecedorId: number, valor: number, tipo: 'recebido' | 'pendente'): Promise<void> {
    await this.createNotification(
      fornecedorId,
      'pagamento',
      tipo === 'recebido' ? 'Pagamento Recebido' : 'Pagamento Pendente',
      tipo === 'recebido' 
        ? `Você recebeu um pagamento de R$ ${valor.toFixed(2)}.`
        : `Você tem um pagamento pendente de R$ ${valor.toFixed(2)}.`,
      { valor, tipo, action: 'view_payments' }
    );
  }

  async notifySupplierProductApproval(fornecedorId: number, produtoNome: string, aprovado: boolean): Promise<void> {
    await this.createNotification(
      fornecedorId,
      'produto',
      aprovado ? 'Produto Aprovado' : 'Produto Rejeitado',
      aprovado 
        ? `Seu produto "${produtoNome}" foi aprovado e já está disponível na loja.`
        : `Seu produto "${produtoNome}" foi rejeitado. Verifique os detalhes e faça as correções necessárias.`,
      { produto: produtoNome, aprovado, action: 'view_products' }
    );
  }

  // Obter configuração de notificação por tipo de usuário
  getNotificationConfig(userType: keyof NotificationConfig, notificationType: string) {
    return this.notificationConfig[userType]?.[notificationType as keyof NotificationConfig[typeof userType]] || 
           { titulo: 'Notificação', icone: 'notifications', cor: '#3498db' };
  }

  // Notificações do sistema para todos os usuários
  async notifySystemMaintenance(startTime: Date, endTime: Date): Promise<void> {
    const allUsers = await databaseService.getUsuarios();
    
    for (const user of allUsers) {
      await this.createNotification(
        user.id,
        'sistema',
        'Manutenção Programada',
        `O sistema estará em manutenção das ${startTime.toLocaleTimeString()} às ${endTime.toLocaleTimeString()}.`,
        { start_time: startTime.toISOString(), end_time: endTime.toISOString() }
      );
    }
  }

  async notifySystemUpdate(version: string, features: string[]): Promise<void> {
    const allUsers = await databaseService.getUsuarios();
    
    for (const user of allUsers) {
      await this.createNotification(
        user.id,
        'sistema',
        'Atualização Disponível',
        `Nova versão ${version} disponível com melhorias: ${features.join(', ')}.`,
        { version, features }
      );
    }
  }
}

export const notificationService = new NotificationService(); 