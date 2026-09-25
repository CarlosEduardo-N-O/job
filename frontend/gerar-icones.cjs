const sharp = require('sharp');

const origem = 'public/icons/job.svg';

async function gerar() {
    await sharp(origem)
        .resize(192, 192)
        .png()
        .toFile('public/icons/job-192.png');

    await sharp(origem)
        .resize(512, 512)
        .png()
        .toFile('public/icons/job-512.png');

    console.log('Ícones PWA gerados com sucesso.');
}

gerar().catch((erro) => {
    console.error('Erro ao gerar os ícones:', erro);
    process.exit(1);
});