import { BoardModel } from '../model/BoardModel';
import { BlockData } from '../model/BlockData';
import { BlockType } from '../model/BlockType';

export class GameLogic {
    board: BoardModel;
    constructor(board: BoardModel) {
        this.board = board;
    }

    swapBlocks(a: BlockData, b: BlockData) {
        const tempType = a.type;
        a.type = b.type;
        b.type = tempType;
    }

    findMatches(): BlockData[][] {
        const matches: BlockData[][] = [];
        // 水平
        for (let r = 0; r < this.board.rows; r++) {
            let match: BlockData[] = [];
            let lastType: BlockType | null = null;
            for (let c = 0; c < this.board.cols; c++) {
                const block = this.board.getBlock(r, c);
                if (block && block.type === lastType) {
                    match.push(block);
                } else {
                    if (match.length >= 3) matches.push([...match]);
                    match = block ? [block] : [];
                }
                lastType = block ? block.type : null;
            }
            if (match.length >= 3) matches.push([...match]);
        }
        // 垂直
        for (let c = 0; c < this.board.cols; c++) {
            let match: BlockData[] = [];
            let lastType: BlockType | null = null;
            for (let r = 0; r < this.board.rows; r++) {
                const block = this.board.getBlock(r, c);
                if (block && block.type === lastType) {
                    match.push(block);
                } else {
                    if (match.length >= 3) matches.push([...match]);
                    match = block ? [block] : [];
                }
                lastType = block ? block.type : null;
            }
            if (match.length >= 3) matches.push([...match]);
        }
        return matches;
    }

    eliminateMatches(matches: BlockData[][]) {
        for (const match of matches) {
            for (const block of match) {
                this.board.setBlock(block.row, block.col, null);
            }
        }
    }

    dropBlocks() {
        for (let c = 0; c < this.board.cols; c++) {
            let empty = this.board.rows - 1;
            for (let r = this.board.rows - 1; r >= 0; r--) {
                const block = this.board.getBlock(r, c);
                if (block) {
                    if (empty !== r) {
                        this.board.setBlock(empty, c, block);
                        this.board.setBlock(r, c, null);
                    }
                    empty--;
                }
            }
        }
    }

    fillNewBlocks() {
        for (let c = 0; c < this.board.cols; c++) {
            for (let r = 0; r < this.board.rows; r++) {
                if (!this.board.getBlock(r, c)) {
                    const type = Math.floor(Math.random() * this.board.blockTypes);
                    this.board.setBlock(r, c, new BlockData(type, r, c));
                }
            }
        }
    }

    hasMatches(): boolean {
        return this.findMatches().length > 0;
    }
} 