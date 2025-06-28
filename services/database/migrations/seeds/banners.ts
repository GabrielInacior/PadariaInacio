import * as SQLite from 'expo-sqlite';

export async function seedBanners(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Seeding banners...');

  const banners = [
    {
      titulo: 'Ofertas Especiais',
      descricao: 'Descontos imperdíveis',
      imagem: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800',
      link: '/promocoes',
      ativo: true,
      ordem: 1
    },
    {
      titulo: 'Produtos Orgânicos',
      descricao: 'Linha orgânica certificada',
      imagem: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
      link: '/organicos',
      ativo: true,
      ordem: 2
    }
  ];

  for (const banner of banners) {
    await db.runAsync(`
      INSERT INTO banners (titulo, descricao, imagem, link, ativo, ordem) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [banner.titulo, banner.descricao, banner.imagem, banner.link, banner.ativo, banner.ordem]);
  }

  console.log(`${banners.length} banners seeded successfully`);
} 