import { BlockData } from './BlockData';
import { BlockType } from './BlockType';

/**
 * 棋盘数据模型
 * 管理整个游戏棋盘的数据状态
 */
export class BoardModel {
    /** 棋盘网格数据，二维数组存储方块 */
    grid: (BlockData | null)[][];
    /** 棋盘行数 */
    readonly rows: number;
    /** 棋盘列数 */
    readonly cols: number;
    /** 方块类型数量 */
    readonly blockTypes: number;

    /**
     * 构造函数
     * @param rows 行数
     * @param cols 列数
     * @param blockTypes 方块类型数量
     */
    constructor(rows: number, cols: number, blockTypes: number) {
        this.rows = rows;
        this.cols = cols;
        this.blockTypes = blockTypes;
        this.grid = [];

        // 初始化空棋盘
        for (let r = 0; r < rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < cols; c++) {
                this.grid[r][c] = null;
            }
        }
    }

    /**
     * 设置指定位置的方块
     * @param row 行坐标
     * @param col 列坐标
     * @param block 方块数据，null表示空位
     */
    setBlock(row: number, col: number, block: BlockData | null) {
        // 边界检查
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return;
        }

        this.grid[row][col] = block;
        if (block) {
            block.row = row;
            block.col = col;
        }
    }

    /**
     * 获取指定位置的方块
     * @param row 行坐标
     * @param col 列坐标
     * @returns 方块数据，null表示空位
     */
    getBlock(row: number, col: number): BlockData | null {
        // 边界检查
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.grid[row][col];
    }

    /**
     * 检查位置是否有效
     * @param row 行坐标
     * @param col 列坐标
     * @returns 位置是否有效
     */
    isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    /**
     * 清空整个棋盘
     */
    clearBoard() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = null;
            }
        }
    }
} 