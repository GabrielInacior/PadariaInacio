import * as SQLite from 'expo-sqlite';

export async function seedCategorias(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Seeding categorias...');

  const categorias = [
    { nome: 'Farinhas', descricao: 'Farinhas diversas para panificação', icone: 'nutrition', cor_tema: '#8B4513', ordem: 1 },
    { nome: 'Açúcares', descricao: 'Açúcares e adoçantes', icone: 'snow', cor_tema: '#FFF', ordem: 2 },
    { nome: 'Óleos e Gorduras', descricao: 'Óleos e gorduras para panificação', icone: 'water', cor_tema: '#FFD700', ordem: 3 },
    { nome: 'Fermento e Melhoradores', descricao: 'Fermentos e melhoradores de massa', icone: 'flask', cor_tema: '#90EE90', ordem: 4 },
    { nome: 'Ovos e Laticínios', descricao: 'Ovos, leite e derivados', icone: 'egg', cor_tema: '#FFFACD', ordem: 5 },
    { nome: 'Frutas e Conservas', descricao: 'Frutas secas e conservas', icone: 'apple', cor_tema: '#FF6347', ordem: 6 },
    { nome: 'Chocolate e Cacau', descricao: 'Chocolates e produtos de cacau', icone: 'cube', cor_tema: '#8B4513', ordem: 7 },
    { nome: 'Especiarias', descricao: 'Temperos e especiarias', icone: 'leaf', cor_tema: '#228B22', ordem: 8 },
    { nome: 'Pães e Massas', descricao: 'Pães prontos e massas frescas', icone: 'restaurant', cor_tema: '#D2691E', ordem: 9 },
    { nome: 'Doces e Bolos', descricao: 'Doces, bolos e sobremesas', icone: 'heart', cor_tema: '#FF69B4', ordem: 10 },
    { nome: 'Salgados', descricao: 'Salgados e lanches', icone: 'pizza', cor_tema: '#FF8C00', ordem: 11 },
    { nome: 'Bebidas', descricao: 'Bebidas quentes e frias', icone: 'wine', cor_tema: '#4682B4', ordem: 12 },
    { nome: 'Embalagens', descricao: 'Embalagens e descartáveis', icone: 'bag', cor_tema: '#708090', ordem: 13 },
    { nome: 'Equipamentos', descricao: 'Equipamentos e utensílios', icone: 'construct', cor_tema: '#2F4F4F', ordem: 14 }
  ];

  for (const categoria of categorias) {
    await db.runAsync(`
      INSERT INTO categorias (nome, descricao, icone, cor_tema, ordem_exibicao) 
      VALUES (?, ?, ?, ?, ?)
    `, [categoria.nome, categoria.descricao, categoria.icone, categoria.cor_tema, categoria.ordem]);
  }

  console.log(`${categorias.length} categorias seeded successfully`);
} 