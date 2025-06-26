import { BlockType } from './BlockType';

export class BlockData {
    type: BlockType;
    row: number;
    col: number;
    constructor(type: BlockType, row: number, col: number) {
        this.type = type;
        this.row = row;
        this.col = col;
    }
} 