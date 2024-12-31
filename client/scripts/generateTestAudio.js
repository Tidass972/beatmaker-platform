const fs = require('fs');
const { exec } = require('child_process');

// Commande ffmpeg pour générer un fichier audio de test
const command = `ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -af "apad=pad_dur=3" public/audio/summer-vibes.mp3`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erreur d'exécution: ${error}`);
    return;
  }
  console.log('Fichier audio de test généré avec succès !');
});
