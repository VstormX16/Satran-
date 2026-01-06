import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Load assets here if needed (images, audio)
        // For now we will use procedural graphics
    }

    create() {
        this.scene.start('GameScene');
    }
}
