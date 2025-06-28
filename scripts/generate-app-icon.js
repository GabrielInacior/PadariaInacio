const fs = require('fs');
const { createCanvas, registerFont } = require('canvas');

// Função para gerar ícone do app com emoji de pão
function generateAppIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient (cores da padaria)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#F4A460'); // Sandy brown (cor do pão)
  gradient.addColorStop(1, '#D2691E'); // Chocolate (cor do pão assado)
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Adicionar um círculo de fundo mais claro
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 20, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF8DC'; // Cornsilk - cor clara do pão
  ctx.fill();

  // Adicionar sombra interna
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 40, 0, Math.PI * 2);
  ctx.fillStyle = '#F5DEB3'; // Wheat color
  ctx.fill();

  // Configurar fonte para emoji
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Desenhar emoji de pão
  ctx.fillStyle = '#000';
  ctx.fillText('🥖', size/2, size/2);

  // Adicionar texto (opcional)
  ctx.font = `${size * 0.08}px Arial, sans-serif`;
  ctx.fillStyle = '#8B4513'; // Saddle brown
  ctx.fillText('PADARIA', size/2, size * 0.8);
  ctx.fillText('INÁCIO', size/2, size * 0.88);

  // Salvar arquivo
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./assets/app-icon.png', buffer);
  
  console.log('✅ Ícone do app gerado: ./assets/app-icon.png');
  
  // Gerar tamanhos diferentes para Android
  generateAdaptiveIcon();
}

function generateAdaptiveIcon() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo transparente para adaptive icon
  ctx.clearRect(0, 0, size, size);

  // Círculo de fundo (foreground do adaptive icon)
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 50, 0, Math.PI * 2);
  ctx.fillStyle = '#F4A460';
  ctx.fill();

  // Emoji centralizado
  ctx.font = `${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText('🥖', size/2, size/2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./assets/adaptive-icon-new.png', buffer);
  
  console.log('✅ Adaptive icon gerado: ./assets/adaptive-icon-new.png');
}

// Executar se chamado diretamente
if (require.main === module) {
  try {
    generateAppIcon();
  } catch (error) {
    console.error('❌ Erro ao gerar ícone:', error.message);
    console.log('💡 Instale a dependência: npm install canvas');
  }
}

module.exports = { generateAppIcon }; 