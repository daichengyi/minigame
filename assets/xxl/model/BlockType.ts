/**
 * 方块类型枚举
 * 定义了游戏中所有可用的方块类型
 */
export enum BlockType {
    RED = 0,    // 红色方块
    BLUE = 1,   // 蓝色方块
    GREEN = 2,  // 绿色方块
    YELLOW = 3, // 黄色方块
    PURPLE = 4  // 紫色方块
}

/**
 * 方块类型工具类
 */
export class BlockTypeUtil {
    /**
     * 获取所有方块类型
     * @returns 所有方块类型数组
     */
    static getAllTypes(): BlockType[] {
        return [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW, BlockType.PURPLE];
    }

    /**
     * 获取方块类型数量
     * @returns 方块类型总数
     */
    static getTypeCount(): number {
        return 5;
    }

    /**
     * 检查方块类型是否有效
     * @param type 方块类型
     * @returns 是否有效
     */
    static isValidType(type: number): boolean {
        return type >= 0 && type < this.getTypeCount();
    }

    /**
     * 获取随机方块类型
     * @returns 随机方块类型
     */
    static getRandomType(): BlockType {
        return Math.floor(Math.random() * this.getTypeCount()) as BlockType;
    }
} 