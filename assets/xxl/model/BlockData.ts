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

    /**
     * 检查方块类型是否有效
     * @returns 类型是否有效
     */
    isValidType(): boolean {
        return this.type >= 0 && this.type <= 4;
    }

    /**
     * 检查位置是否有效
     * @param maxRows 最大行数
     * @param maxCols 最大列数
     * @returns 位置是否有效
     */
    isValidPosition(maxRows: number, maxCols: number): boolean {
        return this.row >= 0 && this.row < maxRows &&
            this.col >= 0 && this.col < maxCols;
    }

    /**
     * 复制方块数据
     * @returns 新的方块数据副本
     */
    clone(): BlockData {
        return new BlockData(this.type, this.row, this.col);
    }

    /**
     * 检查两个方块是否相邻
     * @param other 另一个方块
     * @returns 是否相邻
     */
    isAdjacent(other: BlockData): boolean {
        const rowDiff = Math.abs(this.row - other.row);
        const colDiff = Math.abs(this.col - other.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
} 