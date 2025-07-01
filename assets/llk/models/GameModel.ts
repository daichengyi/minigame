import { _decorator } from 'cc';

export interface BlockData {
    nodeId: string;
    type: number;
    row: number;
    col: number;
    isSelected: boolean;
}

export interface PathPoint {
    row: number;
    col: number;
}

export interface GridNode {
    row: number;
    col: number;
}

export interface GameConfig {
    rows: number;
    cols: number;
    blockWidth: number;
    blockHeight: number;
    blockSpacing: number;
}

export class GameModel {
    private config: GameConfig;
    private blocks: BlockData[][] = [];
    private selectedBlocks: BlockData[] = [];
    private blockTypes: number[] = [];
    private grid: number[][] = [];
    private gridRows: number;
    private gridCols: number;

    constructor(config: GameConfig) {
        this.config = config;
        this.gridRows = config.rows + 2;
        this.gridCols = config.cols + 2;
        this.initGrid();
    }

    // 获取配置
    public getConfig(): GameConfig {
        return this.config;
    }

    // 获取网格尺寸
    public getGridSize() {
        return {
            rows: this.gridRows,
            cols: this.gridCols
        };
    }

    // 初始化网格
    private initGrid(): void {
        this.grid = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                if (row === 0 || row === this.gridRows - 1 ||
                    col === 0 || col === this.gridCols - 1) {
                    this.grid[row][col] = 2; // 边界
                } else {
                    this.grid[row][col] = 0; // 空
                }
            }
        }
    }

    // 生成方块类型
    public generateBlockTypes(): void {
        const totalBlocks = this.config.rows * this.config.cols;
        const pairsCount = totalBlocks / 2;

        this.blockTypes = [];
        for (let i = 0; i < pairsCount; i++) {
            const type = (i % 9) + 1;
            this.blockTypes.push(type, type);
        }

        // 随机打乱
        for (let i = this.blockTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.blockTypes[i], this.blockTypes[j]] = [this.blockTypes[j], this.blockTypes[i]];
        }
    }

    // 创建方块数据
    public createBlocksData(): BlockData[][] {
        this.blocks = [];
        let blockIndex = 0;

        for (let row = 0; row < this.config.rows; row++) {
            this.blocks[row] = [];
            for (let col = 0; col < this.config.cols; col++) {
                const blockData: BlockData = {
                    nodeId: `block_${row}_${col}`,
                    type: this.blockTypes[blockIndex++],
                    row: row,
                    col: col,
                    isSelected: false
                };

                this.blocks[row][col] = blockData;
                this.grid[row + 1][col + 1] = 1; // 标记为有方块
            }
        }

        return this.blocks;
    }

    // 获取方块数据
    public getBlocks(): BlockData[][] {
        return this.blocks;
    }

    // 获取指定位置的方块
    public getBlock(row: number, col: number): BlockData | null {
        if (row >= 0 && row < this.config.rows && col >= 0 && col < this.config.cols) {
            return this.blocks[row][col];
        }
        return null;
    }

    // 选中方块
    public selectBlock(block: BlockData): void {
        if (!block.isSelected) {
            block.isSelected = true;
            this.selectedBlocks.push(block);
        }
    }

    // 取消选中方块
    public deselectBlock(block: BlockData): void {
        block.isSelected = false;
        const index = this.selectedBlocks.indexOf(block);
        if (index > -1) {
            this.selectedBlocks.splice(index, 1);
        }
    }

    // 取消所有选中
    public deselectAllBlocks(): void {
        this.selectedBlocks.forEach(block => {
            block.isSelected = false;
        });
        this.selectedBlocks = [];
    }

    // 获取选中的方块
    public getSelectedBlocks(): BlockData[] {
        return this.selectedBlocks;
    }

    // 消除方块
    public eliminateBlocks(): void {
        this.selectedBlocks.forEach(block => {
            this.blocks[block.row][block.col] = null!;
            this.grid[block.row + 1][block.col + 1] = 0;
        });
        this.selectedBlocks = [];
    }

    // 检查游戏是否结束
    public isGameEnd(): boolean {
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                if (this.blocks[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // 获取网格状态
    public getGrid(): number[][] {
        return this.grid;
    }

    // 检查是否相邻
    public isAdjacent(block1: BlockData, block2: BlockData): boolean {
        const rowDiff = Math.abs(block1.row - block2.row);
        const colDiff = Math.abs(block1.col - block2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 获取方块周围的空位置
    public getEmptyPositionsAround(block: BlockData): GridNode[] {
        const positions: GridNode[] = [];
        const gridRow = block.row + 1;
        const gridCol = block.col + 1;

        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        for (const dir of directions) {
            const newRow = gridRow + dir.row;
            const newCol = gridCol + dir.col;

            if (newRow >= 0 && newRow < this.gridRows &&
                newCol >= 0 && newCol < this.gridCols) {
                if (this.grid[newRow][newCol] !== 1) {
                    positions.push({ row: newRow, col: newCol });
                }
            }
        }

        return positions;
    }

    // 获取邻居节点
    public getNeighbors(node: GridNode): GridNode[] {
        const neighbors: GridNode[] = [];
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        for (const dir of directions) {
            const newRow = node.row + dir.row;
            const newCol = node.col + dir.col;

            if (newRow >= 0 && newRow < this.gridRows &&
                newCol >= 0 && newCol < this.gridCols) {
                if (this.grid[newRow][newCol] !== 1) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
        }

        return neighbors;
    }

    // 重置游戏
    public resetGame(): void {
        this.blocks = [];
        this.selectedBlocks = [];
        this.blockTypes = [];
        this.initGrid();
    }
} 