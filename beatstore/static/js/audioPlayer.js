// Gestion du lecteur audio et des compteurs de lectures
class AudioPlayer {
    constructor() {
        this.audioPlayers = {};
        this.playCounters = {};
        this.initializeAudioPlayers();
    }

    initializeAudioPlayers() {
        // Sélectionne tous les éléments audio sur la page
        document.querySelectorAll('.audio-player').forEach(player => {
            const beatId = player.dataset.beatId;
            this.audioPlayers[beatId] = player;
            this.playCounters[beatId] = 0;

            // Ajoute les écouteurs d'événements
            this.setupEventListeners(player, beatId);
        });
    }

    setupEventListeners(player, beatId) {
        // Gestion du début de lecture
        player.addEventListener('play', () => {
            this.handlePlay(beatId);
        });

        // Gestion de la fin de lecture
        player.addEventListener('ended', () => {
            this.handleEnded(beatId);
        });

        // Mise à jour de la barre de progression
        player.addEventListener('timeupdate', () => {
            this.updateProgress(player);
        });
    }

    handlePlay(beatId) {
        // Arrête tous les autres lecteurs audio
        Object.entries(this.audioPlayers).forEach(([id, otherPlayer]) => {
            if (id !== beatId && !otherPlayer.paused) {
                otherPlayer.pause();
                otherPlayer.currentTime = 0;
            }
        });

        // Incrémente le compteur de lectures
        this.playCounters[beatId]++;
        
        // Mise à jour du compteur dans l'interface si l'élément existe
        const counter = document.querySelector(`#play-count-${beatId}`);
        if (counter) {
            counter.textContent = this.playCounters[beatId];
        }

        // Envoie les données au serveur
        this.updatePlayCount(beatId);
    }

    handleEnded(beatId) {
        const player = this.audioPlayers[beatId];
        player.currentTime = 0;
    }

    updateProgress(player) {
        const progress = (player.currentTime / player.duration) * 100;
        const progressBar = player.parentElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    async updatePlayCount(beatId) {
        try {
            const response = await fetch(`/api/update-play-count/${beatId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (!response.ok) {
                console.error('Erreur lors de la mise à jour du compteur de lectures');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
}

// Initialisation du gestionnaire audio quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.audioPlayer = new AudioPlayer();
});
