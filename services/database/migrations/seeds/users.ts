import * as SQLite from 'expo-sqlite';

export async function seedUsers(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Seeding users...');

  const usuarios = [
    // Admins
    { nome: 'Administrador Geral', email: 'admin@padariainacio.com', senha: 'admin123', tipo: 'admin', nivel_acesso: 5 },
    { nome: 'Carlos Administrador', email: 'carlos.admin@padariainacio.com', senha: 'admin123', tipo: 'admin', nivel_acesso: 5 },
    
    // Gerentes
    { nome: 'Maria Silva', email: 'gerente@padariainacio.com', senha: 'gerente123', tipo: 'gerente', nivel_acesso: 4, cargo: 'Gerente Geral' },
    { nome: 'Roberto Gerente', email: 'roberto.gerente@padariainacio.com', senha: 'gerente123', tipo: 'gerente', nivel_acesso: 4, cargo: 'Gerente de Vendas' },
    { nome: 'Fernanda Gestora', email: 'fernanda.gestora@padariainacio.com', senha: 'gerente123', tipo: 'gerente', nivel_acesso: 4, cargo: 'Gerente de Estoque' },
    
    // Funcionários
    { nome: 'João Santos', email: 'funcionario@padariainacio.com', senha: 'funcionario123', tipo: 'funcionario', nivel_acesso: 3, cargo: 'Atendente' },
    { nome: 'Ana Atendente', email: 'ana.atendente@padariainacio.com', senha: 'funcionario123', tipo: 'funcionario', nivel_acesso: 3, cargo: 'Atendente' },
    { nome: 'Pedro Padeiro', email: 'pedro.padeiro@padariainacio.com', senha: 'funcionario123', tipo: 'funcionario', nivel_acesso: 3, cargo: 'Padeiro' },
    { nome: 'Lucia Confeiteira', email: 'lucia.confeiteira@padariainacio.com', senha: 'funcionario123', tipo: 'funcionario', nivel_acesso: 3, cargo: 'Confeiteira' },
    { nome: 'Marcos Caixa', email: 'marcos.caixa@padariainacio.com', senha: 'funcionario123', tipo: 'funcionario', nivel_acesso: 3, cargo: 'Operador de Caixa' },
    
    // Clientes
    { nome: 'Ana Costa', email: 'cliente@padariainacio.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 150, telefone: '(11) 99999-1111' },
    { nome: 'Bruno Cliente', email: 'bruno.cliente@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 250, telefone: '(11) 99999-2222' },
    { nome: 'Carla Mendes', email: 'carla.mendes@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 89, telefone: '(11) 99999-3333' },
    { nome: 'Daniel Santos', email: 'daniel.santos@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 320, telefone: '(11) 99999-4444' },
    { nome: 'Elaine Oliveira', email: 'elaine.oliveira@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 45, telefone: '(11) 99999-5555' },
    { nome: 'Fernando Lima', email: 'fernando.lima@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 178, telefone: '(11) 99999-6666' },
    { nome: 'Gabriela Silva', email: 'gabriela.silva@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 92, telefone: '(11) 99999-7777' },
    { nome: 'Henrique Costa', email: 'henrique.costa@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 267, telefone: '(11) 99999-8888' },
    { nome: 'Isabela Rocha', email: 'isabela.rocha@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 134, telefone: '(11) 99999-9999' },
    { nome: 'José Ferreira', email: 'jose.ferreira@email.com', senha: 'cliente123', tipo: 'cliente', nivel_acesso: 1, pontos_fidelidade: 201, telefone: '(11) 99999-0000' },
    
    // Fornecedores
    { 
      nome: 'Distribuidora Pão & Cia', 
      email: 'fornecedor@padariainacio.com', 
      senha: 'fornecedor123', 
      tipo: 'fornecedor', 
      nivel_acesso: 2,
      cnpj: '12.345.678/0001-90',
      razao_social: 'Distribuidora Pão & Cia Ltda',
      nome_fantasia: 'Pão & Cia',
      categoria_fornecedor: 'Matérias-primas',
      avaliacao_media: 4.8,
      telefone: '(11) 98765-4321'
    },
    { 
      nome: 'Moinho São Paulo', 
      email: 'moinho.sp@email.com', 
      senha: 'fornecedor123', 
      tipo: 'fornecedor', 
      nivel_acesso: 2,
      cnpj: '23.456.789/0001-01',
      razao_social: 'Moinho São Paulo S.A.',
      nome_fantasia: 'Moinho SP',
      categoria_fornecedor: 'Farinhas e Grãos',
      avaliacao_media: 4.6,
      telefone: '(11) 98765-4322'
    },
    { 
      nome: 'Açúcar & Doces Ltda', 
      email: 'acucar.doces@email.com', 
      senha: 'fornecedor123', 
      tipo: 'fornecedor', 
      nivel_acesso: 2,
      cnpj: '34.567.890/0001-12',
      razao_social: 'Açúcar & Doces Ltda',
      nome_fantasia: 'Açúcar & Doces',
      categoria_fornecedor: 'Açúcares e Adoçantes',
      avaliacao_media: 4.7,
      telefone: '(11) 98765-4323'
    },
    { 
      nome: 'Laticínios Frescos', 
      email: 'laticinios.frescos@email.com', 
      senha: 'fornecedor123', 
      tipo: 'fornecedor', 
      nivel_acesso: 2,
      cnpj: '45.678.901/0001-23',
      razao_social: 'Laticínios Frescos S.A.',
      nome_fantasia: 'Frescos',
      categoria_fornecedor: 'Laticínios',
      avaliacao_media: 4.9,
      telefone: '(11) 98765-4324'
    },
    { 
      nome: 'Chocolate Premium', 
      email: 'chocolate.premium@email.com', 
      senha: 'fornecedor123', 
      tipo: 'fornecedor', 
      nivel_acesso: 2,
      cnpj: '56.789.012/0001-34',
      razao_social: 'Chocolate Premium Ltda',
      nome_fantasia: 'Premium Choco',
      categoria_fornecedor: 'Chocolates',
      avaliacao_media: 4.8,
      telefone: '(11) 98765-4325'
    }
  ];

  for (const usuario of usuarios) {
    await db.runAsync(`
      INSERT INTO users (nome, email, senha, tipo, nivel_acesso, cnpj, razao_social, nome_fantasia, categoria_fornecedor, avaliacao_media, telefone, cargo, pontos_fidelidade) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      usuario.nome, usuario.email, usuario.senha, usuario.tipo, usuario.nivel_acesso,
      usuario.cnpj || null, usuario.razao_social || null, usuario.nome_fantasia || null,
      usuario.categoria_fornecedor || null, usuario.avaliacao_media || 0,
      usuario.telefone || null, usuario.cargo || null, usuario.pontos_fidelidade || 0
    ]);
  }

  console.log(`${usuarios.length} users seeded successfully`);
} 