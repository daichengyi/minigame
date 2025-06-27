import { BlockType } from './BlockType';

/**
 * 方块数据结构
 * 存储单个方块的所有数据信息
 */
export class BlockData {
    /** 方块类型 */
    type: BlockType;
    /** 方块在棋盘中的行坐标 */
    row: number;
    /** 方块在棋盘中的列坐标 */
    col: number;

    /**
     * 构造函数
     * @param type 方块类型
     * @param row 行坐标
     * @param col 列坐标
     */
    constructor(type: BlockType, row: number, col: number) {
        this.type = type;
        this.row = row;
        this.col = col;
    }
} 