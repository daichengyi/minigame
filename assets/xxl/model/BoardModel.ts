import { BlockData } from './BlockData';
import { BlockType } from './BlockType';

export class BoardModel {
    grid: (BlockData | null)[][];
    readonly rows: number;
    readonly cols: number;
    readonly blockTypes: number;

    constructor(rows: number, cols: number, blockTypes: number) {
        this.rows = rows;
        this.cols = cols;
        this.blockTypes = blockTypes;
        this.grid = [];
        for (let r = 0; r < rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < cols; c++) {
                this.grid[r][c] = null;
            }
        }
    }

    setBlock(row: number, col: number, block: BlockData | null) {
        this.grid[row][col] = block;
        if (block) {
            block.row = row;
            block.col = col;
        }
    }

    getBlock(row: number, col: number): BlockData | null {
        return this.grid[row][col];
    }
} 