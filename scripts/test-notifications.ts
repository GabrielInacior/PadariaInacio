import { notificationService } from '../services/notifications/NotificationService';
import { databaseService } from '../services/database';

export async function testNotificationSystem() {
  try {
    console.log('🧪 Iniciando teste do sistema de notificações...');
    
    // Inicializar banco de dados
    await databaseService.init();
    console.log('✅ Banco de dados inicializado');
    
    // Buscar usuários de teste
    const users = await databaseService.getUsuarios();
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Execute o seed primeiro.');
      return false;
    }
    
    const testUser = users[0];
    console.log(`✅ Usuário de teste encontrado: ${testUser.nome} (${testUser.tipo})`);
    
    // Criar notificação de teste
    await notificationService.createNotification(
      testUser.id,
      'sistema',
      'Teste de Notificação',
      'Esta é uma notificação de teste para verificar se o sistema está funcionando corretamente.',
      { test: true, timestamp: new Date().toISOString() }
    );
    console.log('✅ Notificação de teste criada');
    
    // Buscar notificações do usuário
    const notifications = await notificationService.getNotificationsByUser(testUser.id, 10);
    console.log(`✅ ${notifications.length} notificações encontradas para o usuário`);
    
    // Contar notificações não lidas
    const unreadCount = await notificationService.getUnreadCount(testUser.id);
    console.log(`✅ ${unreadCount} notificações não lidas`);
    
    // Testar configuração de notificação
    const config = notificationService.getNotificationConfig(testUser.tipo as any, 'sistema');
    console.log(`✅ Configuração de notificação: ${JSON.stringify(config)}`);
    
    // Se encontrou a notificação de teste, marcar como lida
    const testNotification = notifications.find(n => n.mensagem.includes('teste'));
    if (testNotification) {
      await notificationService.markAsRead(testNotification.id);
      console.log('✅ Notificação de teste marcada como lida');
      
      // Verificar se foi marcada
      const updatedCount = await notificationService.getUnreadCount(testUser.id);
      console.log(`✅ Contador atualizado: ${updatedCount} notificações não lidas`);
    }
    
    console.log('🎉 Teste do sistema de notificações concluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste do sistema de notificações:', error);
    return false;
  }
}

// Teste específico para diferentes tipos de usuário
export async function testNotificationTypes() {
  try {
    console.log('🧪 Testando tipos de notificação...');
    
    await databaseService.init();
    
    // Buscar usuários por tipo
    const admins = await databaseService.getUsuarios('admin');
    const clientes = await databaseService.getUsuarios('cliente');
    const fornecedores = await databaseService.getUsuarios('fornecedor');
    
    // Testar notificações específicas para admin
    if (admins.length > 0) {
      await notificationService.notifyAdminNewOrder(1);
      await notificationService.notifyAdminLowStock('Pão Francês', 5);
      console.log('✅ Notificações de admin criadas');
    }
    
    // Testar notificações específicas para cliente
    if (clientes.length > 0) {
      await notificationService.notifyClientOrderStatus(clientes[0].id, 1, 'confirmado');
      await notificationService.notifyClientPromotion(clientes[0].id, 'Promoção de Teste', '20%');
      console.log('✅ Notificações de cliente criadas');
    }
    
    // Testar notificações específicas para fornecedor
    if (fornecedores.length > 0) {
      await notificationService.notifySupplierNewOrder(fornecedores[0].id, 1, 150.50);
      await notificationService.notifySupplierPayment(fornecedores[0].id, 300.00, 'recebido');
      console.log('✅ Notificações de fornecedor criadas');
    }
    
    console.log('🎉 Teste de tipos de notificação concluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de tipos de notificação:', error);
    return false;
  }
}

// Função para limpar notificações de teste
export async function cleanupTestNotifications() {
  try {
    console.log('🧹 Limpando notificações de teste...');
    
    const users = await databaseService.getUsuarios();
    for (const user of users) {
      const notifications = await notificationService.getNotificationsByUser(user.id, 100);
      const testNotifications = notifications.filter(n => 
        n.mensagem.includes('teste') || 
        n.titulo.includes('Teste') ||
        (n.dados_extras && n.dados_extras.includes('test'))
      );
      
      for (const notification of testNotifications) {
        await notificationService.deleteNotification(notification.id);
      }
      
      if (testNotifications.length > 0) {
        console.log(`✅ ${testNotifications.length} notificações de teste removidas para ${user.nome}`);
      }
    }
    
    console.log('🧹 Limpeza concluída!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return false;
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  (async () => {
    await testNotificationSystem();
    await testNotificationTypes();
  })();
} 