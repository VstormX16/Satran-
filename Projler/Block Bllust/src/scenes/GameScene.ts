import Phaser from 'phaser';
import { Grid } from '../objects/Grid';
import { Block } from '../objects/Block';
import { SHAPES } from '../data/Shapes';

export class GameScene extends Phaser.Scene {
    private grid!: Grid;
    private currentBlocks: (Block | null)[] = [null, null, null];
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private blockSize: number = 32; // Default, checks calculation later

    constructor() {
        super('GameScene');
    }

    create() {
        this.calculateLayout();

        // Create Grid
        const gridWidth = 10 * this.blockSize;
        const startX = (this.scale.width - gridWidth) / 2;
        const startY = 100; // Top padding

        this.grid = new Grid(this, startX, startY, this.blockSize);

        // Score UI
        this.scoreText = this.add.text(this.scale.width / 2, 50, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Initial Spawn
        this.spawnBlocks();

        // Input Handling
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Block) => {
            gameObject.onDragStart();
            // Visual feedback offset against finger/cursor
            // The container dragging in Phaser is usually direct, 
            // but we might want to offset so the user sees the block under their finger.
            // For simplicity, we stick to center dragging or default.
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Block, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Block) => {
            this.handleBlockDrop(gameObject);
        });
    }

    private calculateLayout() {
        // Fit grid to width
        const totalWidth = this.scale.width;
        const margin = 40;
        const availableWidth = totalWidth - margin;
        this.blockSize = Math.floor(availableWidth / 10);
    }

    private spawnBlocks() {
        const spawnY = this.scale.height - 150;
        const positions = [
            this.scale.width * 0.2,
            this.scale.width * 0.5,
            this.scale.width * 0.8
        ];

        for (let i = 0; i < 3; i++) {
            const shape = SHAPES[Phaser.Math.Between(0, SHAPES.length - 1)];
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];

            const block = new Block(this, positions[i], spawnY, shape, color, this.blockSize);
            this.currentBlocks[i] = block;
        }

        this.checkGameOver();
    }

    private handleBlockDrop(block: Block) {
        // Calculate relative position to grid
        const gridBounds = this.grid.getBounds();
        const { x: gridX, y: gridY } = gridBounds;

        // Block x,y is now the CENTER of the block (due to centered draw).
        // We need Top-Left of the block in World Space to match Grid Top-Left.

        // Note: block.scale might be dragged scale (usually 1.0 or larger) or original.
        // During drag, we set scale. On drop, it's still at drag scale until we reset.
        // Let's assume drag scale is 1.0 for calculation simplicity or retrieve actual scale.
        const currentScale = block.scale;

        // Calculate the visual top-left of the block
        const blockHalfWidth = (block.width * currentScale) / 2;
        const blockHalfHeight = (block.height * currentScale) / 2;

        const blockTopLeftX = block.x - blockHalfWidth;
        const blockTopLeftY = block.y - blockHalfHeight;

        // Relative to grid Top-Left
        const relativeX = blockTopLeftX - gridX;
        const relativeY = blockTopLeftY - gridY;

        // We divide by blockSize to find index. 
        // We use Math.round to snap to the nearest cell center.
        // Since we are comparing Top-Lefts, rounding works if we are within half-cell distance.
        // However, since we centered the block based on its total size, and grid cells are also somewhat "centered" in concept of filling:
        // Actually Grid is strictly top-left based (0,0 is top-left cell Top-Left).
        // So checking Top-Left of block vs Top-Left of Grid is correct.

        const col = Math.round(relativeX / this.blockSize);
        const row = Math.round(relativeY / this.blockSize);

        if (this.grid.canPlace(block.shapeMatrix, col, row)) {
            const linesCleared = this.grid.placeBlock(block.shapeMatrix, col, row, block.color);
            this.updateScore(linesCleared, block.shapeMatrix);

            // Remove from list
            const index = this.currentBlocks.indexOf(block);
            if (index > -1) this.currentBlocks[index] = null;

            block.destroyBlock();

            // Check if round over
            if (this.currentBlocks.every(b => b === null)) {
                this.spawnBlocks();
            } else {
                this.checkGameOver();
            }
        } else {
            block.returnToSpawn();
            block.onDragEnd(); // Reset scale
        }
    }

    private updateScore(lines: number, shape: number[][]) {
        // Basic scoring: 10 per block cell placed + 100 * lines
        let cells = 0;
        shape.forEach(row => row.forEach(val => { if (val) cells++; }));

        this.score += cells * 10;
        if (lines > 0) {
            this.score += lines * 100 * lines; // simple combo multiplier
        }

        this.scoreText.setText(`Score: ${this.score}`);
    }

    private checkGameOver() {
        // For each remaining block, check if it fits ANYWHERE in the grid
        // Optimized brute force

        let canMove = false;
        const activeBlocks = this.currentBlocks.filter(b => b !== null) as Block[];

        if (activeBlocks.length === 0) return; // Should allow spawn first

        // If we just spawned, we check. If we placed one, we check remaining.

        // Grid dimensions
        const cols = 10;
        const rows = 10;

        for (const block of activeBlocks) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (this.grid.canPlace(block.shapeMatrix, c, r)) {
                        canMove = true;
                        break;
                    }
                }
                if (canMove) break;
            }
            if (canMove) break;
        }

        if (!canMove) {
            this.handleGameOver();
        }
    }

    private handleGameOver() {
        const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
            fontSize: '48px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5);

        // Restart click
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}
