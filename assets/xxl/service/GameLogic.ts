import { BoardModel } from '../model/BoardModel';
import { BlockData } from '../model/BlockData';
import { BlockType } from '../model/BlockType';

/**
 * 游戏逻辑服务
 * 处理游戏的核心算法和规则
 */
export class GameLogic {
    /** 棋盘数据模型 */
    board: BoardModel;

    /**
     * 构造函数
     * @param board 棋盘数据模型
     */
    constructor(board: BoardModel) {
        this.board = board;
    }

    /**
     * 交换两个方块的类型
     * @param a 第一个方块
     * @param b 第二个方块
     */
    swapBlocks(a: BlockData, b: BlockData) {
        const tempType = a.type;
        a.type = b.type;
        b.type = tempType;
    }

    /**
     * 查找所有匹配的方块组合
     * @returns 匹配的方块组合数组
     */
    findMatches(): BlockData[][] {
        const matches: BlockData[][] = [];

        // 检查水平匹配
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

        // 检查垂直匹配
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

    /**
     * 消除匹配的方块
     * @param matches 要消除的匹配组合
     */
    eliminateMatches(matches: BlockData[][]) {
        for (const match of matches) {
            for (const block of match) {
                this.board.setBlock(block.row, block.col, null);
            }
        }
    }

    /**
     * 执行方块下落逻辑
     * 将上方的方块下移填补空位
     */
    dropBlocks() {
        for (let c = 0; c < this.board.cols; c++) {
            let emptyRow = this.board.rows - 1;

            // 从底部向上扫描，移动方块填补空位
            for (let r = this.board.rows - 1; r >= 0; r--) {
                const block = this.board.getBlock(r, c);
                if (block) {
                    if (emptyRow !== r) {
                        this.board.setBlock(emptyRow, c, block);
                        this.board.setBlock(r, c, null);
                    }
                    emptyRow--;
                }
            }
        }
    }

    /**
     * 填充新方块
     * 在空位处生成新的随机方块
     */
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

    /**
     * 检查是否存在匹配
     * @returns 是否存在匹配
     */
    hasMatches(): boolean {
        return this.findMatches().length > 0;
    }
} 