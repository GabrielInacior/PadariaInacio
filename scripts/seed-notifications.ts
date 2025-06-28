import { notificationService } from '../services/notifications/NotificationService';

// Script para criar notificações de exemplo
async function seedNotifications() {
  console.log('🔔 Criando notificações de exemplo...');

  try {
    // Notificações para Admin (ID 1)
    await notificationService.createNotification(
      1,
      'pedido',
      'Novo Pedido Recebido',
      'Pedido #1234 no valor de R$ 87,50 aguarda confirmação.',
      { pedido_id: 1234, valor: 87.50, action: 'view_order' }
    );

    await notificationService.createNotification(
      1,
      'estoque',
      'Estoque Baixo',
      'Pão Francês está com apenas 15 unidades em estoque.',
      { produto: 'Pão Francês', quantidade: 15, action: 'view_stock' }
    );

    await notificationService.createNotification(
      1,
      'usuario',
      'Novo Cliente Cadastrado',
      'Maria Silva se cadastrou na plataforma.',
      { user_type: 'cliente', nome: 'Maria Silva' }
    );

    await notificationService.createNotification(
      1,
      'financeiro',
      'Meta Atingida',
      'Meta de vendas do dia foi atingida! R$ 2.500,00',
      { meta: 2500, tipo: 'diaria' }
    );

    // Notificações para Cliente (ID 2)
    await notificationService.createNotification(
      2,
      'pedido',
      'Pedido Confirmado',
      'Seu pedido #1235 foi confirmado e está sendo preparado.',
      { pedido_id: 1235, status: 'confirmado', action: 'view_order' }
    );

    await notificationService.createNotification(
      2,
      'promocao',
      'Nova Promoção!',
      'Desconto de 20% em todos os pães artesanais até domingo!',
      { desconto: 20, categoria: 'paes', action: 'view_products' }
    );

    await notificationService.createNotification(
      2,
      'fidelidade',
      'Pontos de Fidelidade',
      'Você ganhou 50 pontos com sua última compra!',
      { pontos: 50, total: 350 }
    );

    await notificationService.createNotification(
      2,
      'entrega',
      'Pedido Saiu para Entrega',
      'Seu pedido está a caminho! Previsão: 25 minutos.',
      { pedido_id: 1235, previsao: '25 min' }
    );

    // Notificações para Fornecedor (ID 5)
    await notificationService.createNotification(
      5,
      'pedido',
      'Novo Pedido de Ingredientes',
      'Padaria Inácio solicitou farinha de trigo (50kg).',
      { produto: 'Farinha de Trigo', quantidade: 50, valor: 125.00 }
    );

    await notificationService.createNotification(
      5,
      'pagamento',
      'Pagamento Recebido',
      'Você recebeu o pagamento de R$ 1.250,00.',
      { valor: 1250.00, tipo: 'recebido' }
    );

    await notificationService.createNotification(
      5,
      'produto',
      'Produto Aprovado',
      'Seu produto "Fermento Biológico Premium" foi aprovado.',
      { produto: 'Fermento Biológico Premium', aprovado: true }
    );

    await notificationService.createNotification(
      5,
      'estoque',
      'Reposição Necessária',
      'Açúcar Cristal está com estoque baixo (8 unidades).',
      { produto: 'Açúcar Cristal', quantidade: 8 }
    );

    // Notificações de sistema para todos
    const allUserIds = [1, 2, 3, 4, 5];
    
    for (const userId of allUserIds) {
      await notificationService.createNotification(
        userId,
        'sistema',
        'Nova Atualização',
        'O app foi atualizado com melhorias de performance e novas funcionalidades.',
        { version: '1.2.0', features: ['Performance', 'UI/UX', 'Notificações'] }
      );
    }

    console.log('✅ Notificações de exemplo criadas com sucesso!');
    
    // Estatísticas
    console.log('\n📊 Estatísticas:');
    for (const userId of [1, 2, 5]) {
      const count = await notificationService.getUnreadCount(userId);
      const userType = userId === 1 ? 'Admin' : userId === 2 ? 'Cliente' : 'Fornecedor';
      console.log(`${userType} (ID ${userId}): ${count} notificações não lidas`);
    }

  } catch (error) {
    console.error('❌ Erro ao criar notificações:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedNotifications();
}

export { seedNotifications }; 