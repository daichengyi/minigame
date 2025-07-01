import { BlockData, GridNode, PathPoint } from '../models/GameModel';

export class PathFinder {
    private gameModel: any; // 这里应该使用GameModel类型，但为了避免循环依赖，暂时使用any

    constructor(gameModel: any) {
        this.gameModel = gameModel;
    }

    // 查找连接路径
    public findPath(block1: BlockData, block2: BlockData): PathPoint[] | null {
        console.log('检查消除条件：', block1.row, block1.col, block2.row, block2.col);

        // 1. 检查相邻连接
        if (this.gameModel.isAdjacent(block1, block2)) {
            console.log('相邻连接可行');
            return [
                { row: block1.row, col: block1.col },
                { row: block2.row, col: block2.col }
            ];
        }

        // 2. 使用优化的A*寻路查找连接路径
        const path = this.findPathAStar(block1, block2);
        if (path) {
            // console.log('A*寻路找到路径');
            // 对路径进行平滑处理
            const smoothedPath = this.smoothPath(path);
            return smoothedPath;
        }

        // console.log('无法找到连接路径');
        return null;
    }

    // A*寻路算法（优化版本）
    private findPathAStar(block1: BlockData, block2: BlockData): PathPoint[] | null {
        console.log('A*寻路开始:', block1.row, block1.col, '->', block2.row, block2.col);

        // 获取两个方块周围的空位置作为起点和终点
        const startPositions = this.gameModel.getEmptyPositionsAround(block1);
        const endPositions = this.gameModel.getEmptyPositionsAround(block2);

        console.log('起点候选位置:', startPositions);
        console.log('终点候选位置:', endPositions);

        // 收集所有可能的路径
        const allPaths: PathPoint[][] = [];

        // 尝试所有起点和终点的组合，收集所有路径
        for (const startPos of startPositions) {
            for (const endPos of endPositions) {
                const path = this.findPathBetweenPositions(startPos, endPos);
                if (path) {
                    const finalPath = this.buildFinalPath(path, block1, block2);
                    allPaths.push(finalPath);
                }
            }
        }

        if (allPaths.length === 0) {
            console.log('没有找到任何路径');
            return null;
        }

        // 对每条路径进行平滑处理
        const smoothedPaths = allPaths.map(path => this.smoothPath(path));

        // 选择拐弯最少的路径
        const bestPath = this.selectPathWithLeastTurns(smoothedPaths);

        // console.log(`找到 ${allPaths.length} 条路径，选择拐弯最少的路径`, allPaths);
        return bestPath;
    }

    // 选择拐弯最少的路径
    private selectPathWithLeastTurns(paths: PathPoint[][]): PathPoint[] {
        if (paths.length === 0) return null!;
        if (paths.length === 1) return paths[0];

        let bestPath = paths[0];
        let minTurns = this.countTurns(paths[0]);

        // console.log(`路径 1: ${minTurns} 个拐弯, 长度: ${paths[0].length}`);

        for (let i = 1; i < paths.length; i++) {
            const turns = this.countTurns(paths[i]);
            // console.log(`路径 ${i + 1}: ${turns} 个拐弯, 长度: ${paths[i].length}`);

            if (turns < minTurns) {
                minTurns = turns;
                bestPath = paths[i];
            } else if (turns === minTurns) {
                // 如果拐弯数相同，选择路径更短的
                if (paths[i].length < bestPath.length) {
                    bestPath = paths[i];
                }
            }
        }

        // console.log(`选择路径，拐弯数: ${minTurns}, 路径长度: ${bestPath.length}`);
        return bestPath;
    }

    // 计算路径的拐弯数量（优化版本）
    private countTurns(path: PathPoint[]): number {
        if (path.length <= 2) return 0;

        let turns = 0;
        let prevDirection = -1;

        for (let i = 1; i < path.length; i++) {
            const currentDirection = this.getDirection(path[i - 1], path[i]);

            if (prevDirection !== -1 && prevDirection !== currentDirection) {
                turns++;
            }

            prevDirection = currentDirection;
        }

        return turns;
    }

    // 在两个位置之间寻找路径（优化版本）
    private findPathBetweenPositions(start: GridNode, end: GridNode): GridNode[] | null {
        const openSet: GridNode[] = [];
        const closedSet: Set<string> = new Set();
        const cameFrom: Map<string, GridNode> = new Map();
        const gScore: Map<string, number> = new Map();
        const fScore: Map<string, number> = new Map();
        const direction: Map<string, number> = new Map(); // 记录移动方向

        openSet.push(start);
        gScore.set(this.nodeKey(start), 0);
        fScore.set(this.nodeKey(start), this.heuristic(start, end));
        direction.set(this.nodeKey(start), -1); // 起始点无方向

        while (openSet.length > 0) {
            // 找到fScore最小的节点
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(this.nodeKey(openSet[i])) < fScore.get(this.nodeKey(openSet[currentIndex]))) {
                    currentIndex = i;
                }
            }

            const current = openSet[currentIndex];

            // 到达目标
            if (current.row === end.row && current.col === end.col) {
                return this.reconstructPathFromPositions(cameFrom, current);
            }

            openSet.splice(currentIndex, 1);
            closedSet.add(this.nodeKey(current));

            // 检查四个方向的邻居
            const neighbors = this.gameModel.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (closedSet.has(this.nodeKey(neighbor))) {
                    continue;
                }

                // 计算移动方向
                const moveDirection = this.getMoveDirection(current, neighbor);
                const currentDirection = direction.get(this.nodeKey(current)) || -1;

                // 计算移动成本（更强的拐点惩罚）
                let moveCost = 1;
                if (currentDirection !== -1 && currentDirection !== moveDirection) {
                    moveCost += 5; // 更强的拐点惩罚
                }

                const tentativeGScore = gScore.get(this.nodeKey(current)) + moveCost;

                if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(this.nodeKey(neighbor))) {
                    continue;
                }

                cameFrom.set(this.nodeKey(neighbor), current);
                gScore.set(this.nodeKey(neighbor), tentativeGScore);
                fScore.set(this.nodeKey(neighbor), tentativeGScore + this.heuristic(neighbor, end));
                direction.set(this.nodeKey(neighbor), moveDirection);
            }
        }

        return null;
    }

    // 获取移动方向
    private getMoveDirection(from: GridNode, to: GridNode): number {
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        if (rowDiff === -1) return 0; // 上
        if (rowDiff === 1) return 1;  // 下
        if (colDiff === -1) return 2; // 左
        if (colDiff === 1) return 3;  // 右
        return -1;
    }

    // 路径平滑处理
    private smoothPath(path: PathPoint[]): PathPoint[] {
        if (path.length <= 2) return path;

        const smoothed: PathPoint[] = [];
        smoothed.push(path[0]);

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];

            // 检查是否可以跳过当前点（直线连接）
            if (this.canConnectDirectly(prev, next)) {
                // 跳过当前点，直接连接前后点
                continue;
            } else {
                // 保留当前点
                smoothed.push(current);
            }
        }

        smoothed.push(path[path.length - 1]);
        return smoothed;
    }

    // 检查两点是否可以直线连接
    private canConnectDirectly(point1: PathPoint, point2: PathPoint): boolean {
        // 如果是相邻点，直接连接
        if (Math.abs(point1.row - point2.row) + Math.abs(point1.col - point2.col) === 1) {
            return true;
        }

        // 检查是否在同一行或同一列，且中间无障碍
        if (point1.row === point2.row) {
            // 同一行，检查列之间是否有障碍
            const minCol = Math.min(point1.col, point2.col);
            const maxCol = Math.max(point1.col, point2.col);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.gameModel.getBlock(point1.row, col)) {
                    return false; // 有障碍
                }
            }
            return true;
        }

        if (point1.col === point2.col) {
            // 同一列，检查行之间是否有障碍
            const minRow = Math.min(point1.row, point2.row);
            const maxRow = Math.max(point1.row, point2.row);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.gameModel.getBlock(row, point1.col)) {
                    return false; // 有障碍
                }
            }
            return true;
        }

        return false;
    }

    // 获取两点间的方向
    private getDirection(from: PathPoint, to: PathPoint): number {
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        if (rowDiff === -1) return 0; // 上
        if (rowDiff === 1) return 1;  // 下
        if (colDiff === -1) return 2; // 左
        if (colDiff === 1) return 3;  // 右
        return -1;
    }

    // 重建位置路径
    private reconstructPathFromPositions(cameFrom: Map<string, GridNode>, current: GridNode): GridNode[] {
        const path: GridNode[] = [];
        let currentKey = this.nodeKey(current);

        while (cameFrom.has(currentKey)) {
            path.unshift(current);
            current = cameFrom.get(currentKey)!;
            currentKey = this.nodeKey(current);
        }

        path.unshift(current);
        return path;
    }

    // 构建最终路径
    private buildFinalPath(path: GridNode[], block1: BlockData, block2: BlockData): PathPoint[] {
        const result: PathPoint[] = [];

        // 添加起点方块
        result.push({ row: block1.row, col: block1.col });

        // 添加路径点（转换回游戏坐标）
        for (const node of path) {
            result.push({ row: node.row - 1, col: node.col - 1 });
        }

        // 添加终点方块
        result.push({ row: block2.row, col: block2.col });

        return result;
    }

    // 启发式函数（曼哈顿距离）
    private heuristic(node: GridNode, goal: GridNode): number {
        return Math.abs(node.row - goal.row) + Math.abs(node.col - goal.col);
    }

    // 节点键值
    private nodeKey(node: GridNode): string {
        return `${node.row},${node.col}`;
    }
} 