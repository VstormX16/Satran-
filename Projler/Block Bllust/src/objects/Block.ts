import Phaser from 'phaser';

export class Block extends Phaser.GameObjects.Container {
    public shapeMatrix: number[][];
    public color: number;
    private blockSize: number;
    private originalScale: number = 0.6;
    private dragScale: number = 1.0;
    private originalX: number;
    private originalY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, matrix: number[][], color: number, blockSize: number) {
        super(scene, x, y);
        this.originalX = x;
        this.originalY = y;
        this.shapeMatrix = matrix;
        this.color = color;
        this.blockSize = blockSize;

        const width = matrix[0].length * blockSize;
        const height = matrix.length * blockSize;

        this.setSize(width, height);

        this.drawBlock(width, height);

        // Interactive area centered
        const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        scene.input.setDraggable(this);

        this.setScale(this.originalScale);
        scene.add.existing(this);
    }

    private drawBlock(totalWidth: number, totalHeight: number) {
        const offsetX = -totalWidth / 2;
        const offsetY = -totalHeight / 2;

        for (let r = 0; r < this.shapeMatrix.length; r++) {
            for (let c = 0; c < this.shapeMatrix[r].length; c++) {
                if (this.shapeMatrix[r][c] === 1) {
                    const g = this.scene.add.graphics();
                    g.fillStyle(this.color, 1);
                    g.fillRoundedRect(
                        offsetX + c * this.blockSize,
                        offsetY + r * this.blockSize,
                        this.blockSize - 2,
                        this.blockSize - 2,
                        4
                    );
                    this.add(g);
                }
            }
        }
    }

    public onDragStart() {
        this.setScale(this.dragScale);
        this.scene.children.bringToTop(this);
    }

    public onDragEnd() {
        this.setScale(this.originalScale);
        this.x = this.originalX;
        this.y = this.originalY;
    }

    public returnToSpawn() {
        this.x = this.originalX;
        this.y = this.originalY;
        this.setScale(this.originalScale);
    }

    public destroyBlock() {
        this.destroy(); // Remove from scene
    }
}
