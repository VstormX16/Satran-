import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { Preloader } from './scenes/Preloader';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth > 600 ? 600 : window.innerWidth, // Responsive width cap
    height: window.innerHeight,
    parent: 'app',
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Preloader, GameScene]
};

new Phaser.Game(config);
