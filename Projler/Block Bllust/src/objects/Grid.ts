import Phaser from 'phaser';

export class Grid {
    private rows: number = 10;
    private cols: number = 10;
    private cellSize: number = 40; // Will be dynamic
    private gridData: number[][] = [];
    private scene: Phaser.Scene;
    private gridContainer: Phaser.GameObjects.Container;
    private cellGraphics: Phaser.GameObjects.Graphics[][] = [];
    private startX: number = 0;
    private startY: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, cellSize: number) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.cellSize = cellSize;
        this.gridContainer = this.scene.add.container(x, y);

        this.initGrid();
        this.drawGrid();
    }

    private initGrid() {
        this.gridData = [];
        this.cellGraphics = [];
        for (let r = 0; r < this.rows; r++) {
            const rowData: number[] = [];
            const rowGraphics: Phaser.GameObjects.Graphics[] = [];
            for (let c = 0; c < this.cols; c++) {
                rowData.push(0);
                rowGraphics.push(this.createCellGraphic(c, r, 0));
            }
            this.gridData.push(rowData);
            this.cellGraphics.push(rowGraphics);
        }
    }

    private createCellGraphic(col: number, row: number, state: number): Phaser.GameObjects.Graphics {
        const g = this.scene.add.graphics();
        const size = this.cellSize - 2; // gap
        const color = state === 0 ? 0x333333 : 0xffffff;
        g.fillStyle(color, 1);
        g.fillRoundedRect(col * this.cellSize, row * this.cellSize, size, size, 4);
        this.gridContainer.add(g);
        return g;
    }

    private updateCellVisual(col: number, row: number, filled: boolean, color: number = 0xffffff) {
        const g = this.cellGraphics[row][col];
        g.clear();
        const size = this.cellSize - 2;
        const fillColor = filled ? color : 0x333333;
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(col * this.cellSize, row * this.cellSize, size, size, 4);
    }

    public canPlace(matrix: number[][], gridCol: number, gridRow: number): boolean {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] === 1) {
                    const targetRow = gridRow + r;
                    const targetCol = gridCol + c;

                    // Check bounds
                    if (targetRow < 0 || targetRow >= this.rows || targetCol < 0 || targetCol >= this.cols) {
                        return false;
                    }

                    // Check overlap
                    if (this.gridData[targetRow][targetCol] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    public placeBlock(matrix: number[][], gridCol: number, gridRow: number, color: number): number {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] === 1) {
                    this.gridData[gridRow + r][gridCol + c] = 1;
                    this.updateCellVisual(gridCol + c, gridRow + r, true, color);
                }
            }
        }
        return this.checkLines();
    }

    private checkLines(): number {
        let linesCleared = 0;
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];

        // Check Rows
        for (let r = 0; r < this.rows; r++) {
            if (this.gridData[r].every(val => val !== 0)) {
                rowsToClear.push(r);
            }
        }

        // Check Cols
        for (let c = 0; c < this.cols; c++) {
            let full = true;
            for (let r = 0; r < this.rows; r++) {
                if (this.gridData[r][c] === 0) {
                    full = false;
                    break;
                }
            }
            if (full) colsToClear.push(c);
        }

        // Clear Logic
        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            linesCleared = rowsToClear.length + colsToClear.length;
            this.clearLines(rowsToClear, colsToClear);
        }

        return linesCleared;
    }

    private clearLines(rows: number[], cols: number[]) {
        // Create a set of cleared cells to avoid double clearing animation if needed
        // Simple atomic clearing
        rows.forEach(r => {
            for (let c = 0; c < this.cols; c++) {
                this.gridData[r][c] = 0;
                this.updateCellVisual(c, r, false);
            }
        });
        cols.forEach(c => {
            for (let r = 0; r < this.rows; r++) {
                this.gridData[r][c] = 0;
                this.updateCellVisual(c, r, false);
            }
        });
    }

    public getCellSize() {
        return this.cellSize;
    }

    public getBounds() {
        return {
            x: this.startX,
            y: this.startY,
            width: this.cols * this.cellSize,
            height: this.rows * this.cellSize
        };
    }
}
