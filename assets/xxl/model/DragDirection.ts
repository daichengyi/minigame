/**
 * 拖拽方向枚举
 * 定义了拖拽的四个方向
 */
export enum DragDirection {
    UP = 1,     // 向上拖拽
    DOWN = 2,   // 向下拖拽
    LEFT = 3,   // 向左拖拽
    RIGHT = 4   // 向右拖拽
}

/**
 * 拖拽方向工具类
 */
export class DragDirectionUtil {
    /**
     * 获取所有拖拽方向
     * @returns 所有拖拽方向数组
     */
    static getAllDirections(): DragDirection[] {
        return [DragDirection.UP, DragDirection.DOWN, DragDirection.LEFT, DragDirection.RIGHT];
    }

    /**
     * 检查拖拽方向是否有效
     * @param direction 拖拽方向
     * @returns 是否有效
     */
    static isValidDirection(direction: number): boolean {
        return direction >= 1 && direction <= 4;
    }

    /**
     * 获取相反方向
     * @param direction 当前方向
     * @returns 相反方向
     */
    static getOppositeDirection(direction: DragDirection): DragDirection {
        switch (direction) {
            case DragDirection.UP: return DragDirection.DOWN;
            case DragDirection.DOWN: return DragDirection.UP;
            case DragDirection.LEFT: return DragDirection.RIGHT;
            case DragDirection.RIGHT: return DragDirection.LEFT;
            default: return DragDirection.UP;
        }
    }

    /**
     * 获取方向的行列偏移
     * @param direction 拖拽方向
     * @returns 行列偏移对象
     */
    static getDirectionOffset(direction: DragDirection): { row: number, col: number } {
        switch (direction) {
            case DragDirection.UP: return { row: -1, col: 0 };
            case DragDirection.DOWN: return { row: 1, col: 0 };
            case DragDirection.LEFT: return { row: 0, col: -1 };
            case DragDirection.RIGHT: return { row: 0, col: 1 };
            default: return { row: 0, col: 0 };
        }
    }
} 