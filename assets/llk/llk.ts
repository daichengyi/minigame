import { _decorator, Component, Node, Prefab, instantiate, Sprite, SpriteFrame, resources, UITransform, Vec3, Color, Graphics } from 'cc';
const { ccclass, property } = _decorator;

interface BlockData {
    node: Node;
    type: number;
    row: number;
    col: number;
    isSelected: boolean;
}

interface PathPoint {
    row: number;
    col: number;
}

interface GridNode {
    row: number;
    col: number;
}

/**
 * 连连看
 */
@ccclass('llk')
export class llk extends Component {
    @property(Node) private content: Node = null!;
    @property(Node) private block: Node = null!;

    // 游戏配置
    private ROWS: number = 12;
    private COLS: number = 10;
    private BLOCK_WIDTH: number = 60;
    private BLOCK_HEIGHT: number = 60;
    private readonly BLOCK_SPACING: number = 2;

    // 扩展边界后的网格大小
    private GRID_ROWS: number = 14; // ROWS + 2
    private GRID_COLS: number = 12; // COLS + 2

    // 游戏状态
    private blocks: BlockData[][] = [];
    private selectedBlocks: BlockData[] = [];
    private blockTypes: number[] = [];
    private spriteFrames: SpriteFrame[] = [];
    private lineNode: Node = null!;
    private graphics: Graphics = null!;
    private gridNode: Node = null!;
    private gridGraphics: Graphics = null!;

    // 网格状态：0=空，1=有方块，2=边界
    private grid: number[][] = [];

    start() {
        this.initGame();
    }

    private async initGame() {
        await this.loadResources();
        this.calculateBlockSize();
        this.initGrid();
        this.initLineNode();
        this.generateBlockTypes();
        this.createBlocks();
    }

    private async loadResources() {
        // 加载1-9的图片资源
        for (let i = 1; i <= 9; i++) {
            try {
                const spriteFrame = await this.loadSpriteFrame(`llk/${i}`);
                this.spriteFrames.push(spriteFrame);
            } catch (error) {
                console.error(`加载资源失败: ${i}.png`, error);
            }
        }
    }

    private loadSpriteFrame(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            resources.load(`${path}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
    }

    private calculateBlockSize() {
        if (this.block) {
            const transform = this.block.getComponent(UITransform);
            if (transform) {
                this.BLOCK_WIDTH = transform.width;
                this.BLOCK_HEIGHT = transform.height;
            }
        }
    }

    private initGrid() {
        // 初始化网格
        this.grid = [];
        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                // 边界设置为2，内部区域设置为0
                if (row === 0 || row === this.GRID_ROWS - 1 ||
                    col === 0 || col === this.GRID_COLS - 1) {
                    this.grid[row][col] = 2; // 边界
                } else {
                    this.grid[row][col] = 0; // 空
                }
            }
        }
    }

    private initLineNode() {
        // 创建连线节点
        this.lineNode = new Node('LineNode');
        this.graphics = this.lineNode.addComponent(Graphics);

        // 确保节点激活
        this.lineNode.active = true;
        this.lineNode.layer = this.content.layer;

        // 添加到content节点
        this.content.addChild(this.lineNode);

        // 设置连线样式
        this.graphics.lineWidth = 6;
        this.graphics.strokeColor = new Color(255, 0, 0, 255); // 红色连线

        // 设置节点层级，确保在最前面
        // this.lineNode.setSiblingIndex(999);

        console.log('连线节点初始化完成');

        // 创建独立的网格节点
        this.initGridNode();
    }

    private initGridNode() {
        console.log('开始初始化网格节点...');

        // 创建网格节点
        this.gridNode = new Node('GridNode');
        this.gridGraphics = this.gridNode.addComponent(Graphics);

        // 确保节点激活
        this.gridNode.active = true;
        this.gridNode.layer = this.content.layer;

        // 添加到content节点，确保在连线节点之前（在背景）
        this.content.addChild(this.gridNode);
        this.gridNode.setSiblingIndex(0); // 设置为最底层

        console.log('网格节点初始化完成');
        console.log('gridNode:', this.gridNode);
        console.log('gridGraphics:', this.gridGraphics);
        console.log('content children count:', this.content.children.length);

        // 绘制网格
        // this.drawAStartGrid();
    }

    // 绘制网格
    private drawAStartGrid() {
        if (!this.gridGraphics) {
            console.log('gridGraphics不存在');
            return;
        }

        console.log('开始绘制网格...');
        console.log('GRID_ROWS:', this.GRID_ROWS, 'GRID_COLS:', this.GRID_COLS);
        console.log('BLOCK_WIDTH:', this.BLOCK_WIDTH, 'BLOCK_HEIGHT:', this.BLOCK_HEIGHT);

        // 清除之前的网格
        this.gridGraphics.clear();

        // 设置网格样式
        this.gridGraphics.strokeColor = new Color(255, 255, 255, 255); // 白色，不透明，更容易看到
        this.gridGraphics.lineWidth = 4;

        // 以content为中心计算起始位置
        const totalWidth = this.COLS * this.BLOCK_WIDTH + (this.COLS - 1) * this.BLOCK_SPACING;
        const totalHeight = this.ROWS * this.BLOCK_HEIGHT + (this.ROWS - 1) * this.BLOCK_SPACING;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        console.log('起始位置:', startX, startY);

        // 绘制垂直线（列）
        for (let col = 0; col <= this.GRID_COLS; col++) {
            const x = startX + (col - 1) * (this.BLOCK_WIDTH + this.BLOCK_SPACING);
            const topY = startY + (this.BLOCK_HEIGHT + this.BLOCK_SPACING);
            const bottomY = startY - this.ROWS * (this.BLOCK_HEIGHT + this.BLOCK_SPACING);

            console.log(`垂直线 ${col}: x=${x}, topY=${topY}, bottomY=${bottomY}`);

            this.gridGraphics.moveTo(x, topY);
            this.gridGraphics.lineTo(x, bottomY);
        }

        // 绘制水平线（行）
        for (let row = 0; row <= this.GRID_ROWS; row++) {
            const y = startY - (row - 1) * (this.BLOCK_HEIGHT + this.BLOCK_SPACING);
            const leftX = startX - (this.BLOCK_WIDTH + this.BLOCK_SPACING);
            const rightX = startX + this.COLS * (this.BLOCK_WIDTH + this.BLOCK_SPACING);

            console.log(`水平线 ${row}: y=${y}, leftX=${leftX}, rightX=${rightX}`);

            this.gridGraphics.moveTo(leftX, y);
            this.gridGraphics.lineTo(rightX, y);
        }

        this.gridGraphics.stroke();

        console.log('网格绘制完成');
    }

    private generateBlockTypes() {
        // 生成成对的方块类型
        const totalBlocks = this.ROWS * this.COLS;
        const pairsCount = totalBlocks / 2;

        this.blockTypes = [];
        for (let i = 0; i < pairsCount; i++) {
            const type = (i % 9) + 1; // 1-9循环
            this.blockTypes.push(type, type); // 添加一对
        }

        // 随机打乱
        for (let i = this.blockTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.blockTypes[i], this.blockTypes[j]] = [this.blockTypes[j], this.blockTypes[i]];
        }
    }

    private createBlocks() {
        // 清空现有方块，但保留LineNode和GridNode
        const children = this.content.children;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child.name !== 'LineNode' && child.name !== 'GridNode') {
                child.destroy();
            }
        }

        this.blocks = [];
        this.selectedBlocks = [];

        // 重新初始化网格
        this.initGrid();

        // 以content为中心计算起始位置
        const totalWidth = this.COLS * this.BLOCK_WIDTH + (this.COLS - 1) * this.BLOCK_SPACING;
        const totalHeight = this.ROWS * this.BLOCK_HEIGHT + (this.ROWS - 1) * this.BLOCK_SPACING;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        let blockIndex = 0;

        for (let row = 0; row < this.ROWS; row++) {
            this.blocks[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                const blockNode = this.createBlockNode();
                const blockData: BlockData = {
                    node: blockNode,
                    type: this.blockTypes[blockIndex++],
                    row: row,
                    col: col,
                    isSelected: false
                };

                this.blocks[row][col] = blockData;

                // 在网格中标记方块位置（注意偏移1，因为网格有边界）
                this.grid[row + 1][col + 1] = 1;

                // 设置位置
                const x = startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING) + this.BLOCK_WIDTH / 2;
                const y = startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING) - this.BLOCK_HEIGHT / 2;
                blockNode.setPosition(x, y, 0);

                // 设置图片
                const sprite = blockNode.getComponent(Sprite);
                if (sprite && this.spriteFrames[blockData.type - 1]) {
                    sprite.spriteFrame = this.spriteFrames[blockData.type - 1];
                }

                // 添加到content
                this.content.addChild(blockNode);
            }
        }

        // 重新绘制网格
        // this.drawAStartGrid();
    }

    private createBlockNode(): Node {
        // 使用block节点进行实例化
        const node = instantiate(this.block);

        node.active = true;
        // 设置尺寸
        const transform = node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.BLOCK_WIDTH, this.BLOCK_HEIGHT);
        }

        // 添加点击事件
        node.on(Node.EventType.TOUCH_END, () => {
            this.onBlockClick(node);
        });

        return node;
    }

    private onBlockClick(blockNode: Node) {
        // 找到对应的blockData
        let targetBlock: BlockData | null = null;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.blocks[row][col] && this.blocks[row][col].node === blockNode) {
                    targetBlock = this.blocks[row][col];
                    break;
                }
            }
            if (targetBlock) break;
        }

        if (!targetBlock) return;

        // 如果已经选中，则取消选中
        if (targetBlock.isSelected) {
            this.deselectBlock(targetBlock);
            return;
        }

        // 选中方块
        this.selectBlock(targetBlock);

        // 检查是否可以消除
        if (this.selectedBlocks.length === 2) {
            if (this.selectedBlocks[0].type === this.selectedBlocks[1].type) {
                // 查找连接路径
                const path = this.findPath(this.selectedBlocks[0], this.selectedBlocks[1]);
                console.log('查找路径结果：', path);

                if (path && path.length > 0) {
                    // 画出连线
                    this.drawConnectionLine(path);
                    // 延迟消除，让玩家看到连线
                    this.scheduleOnce(() => {
                        this.eliminateBlocks();
                        this.clearLine();
                    }, 0.5);
                } else {
                    console.log('无法找到连接路径');
                    // 无法连接，取消选中
                    this.deselectAllBlocks();
                }
            } else {
                // 类型不同，取消选中
                this.deselectAllBlocks();
            }
        }
    }

    private selectBlock(block: BlockData) {
        block.isSelected = true;
        this.selectedBlocks.push(block);

        // 视觉反馈：改变颜色
        const sprite = block.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 0, 255); // 黄色高亮
        }
    }

    private deselectBlock(block: BlockData) {
        block.isSelected = false;
        const index = this.selectedBlocks.indexOf(block);
        if (index > -1) {
            this.selectedBlocks.splice(index, 1);
        }

        // 恢复颜色
        const sprite = block.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255, 255); // 白色
        }
    }

    private deselectAllBlocks() {
        this.selectedBlocks.forEach(block => {
            this.deselectBlock(block);
        });
    }

    private eliminateBlocks() {
        console.log('开始消除方块...');

        // 消除选中的方块
        this.selectedBlocks.forEach(block => {
            console.log(`消除方块: (${block.row}, ${block.col})`);
            block.node.destroy();
            this.blocks[block.row][block.col] = null!;
            // 更新网格状态
            this.grid[block.row + 1][block.col + 1] = 0;
            console.log(`网格状态更新: grid[${block.row + 1}][${block.col + 1}] = 0`);
        });

        this.selectedBlocks = [];

        // 检查游戏是否结束
        this.checkGameEnd();

        console.log('方块消除完成');
    }

    private checkGameEnd() {
        let remainingBlocks = 0;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.blocks[row][col]) {
                    remainingBlocks++;
                }
            }
        }

        if (remainingBlocks === 0) {
            console.log('游戏胜利！');
            // 这里可以添加游戏胜利的逻辑
        }
    }

    // 公共方法：重新开始游戏
    public restartGame() {
        this.initGame();
    }

    // 公共方法：设置游戏参数
    public setGameConfig(rows: number, cols: number, blockWidth: number = 60, blockHeight: number = 60) {
        this.ROWS = rows;
        this.COLS = cols;
        this.BLOCK_WIDTH = blockWidth;
        this.BLOCK_HEIGHT = blockHeight;
        this.restartGame();
    }

    // 路径查找方法
    private findPath(block1: BlockData, block2: BlockData): PathPoint[] | null {
        // 使用统一的消除检查方法
        return this.canEliminate(block1, block2);
    }

    // 统一的消除检查方法
    private canEliminate(block1: BlockData, block2: BlockData): PathPoint[] | null {
        console.log('检查消除条件：', block1.row, block1.col, block2.row, block2.col);

        // 1. 检查相邻连接（上下左右四个方向）
        if (this.isAdjacent(block1, block2)) {
            console.log('相邻连接可行');
            return [
                { row: block1.row, col: block1.col },
                { row: block2.row, col: block2.col }
            ];
        }

        // 2. 使用A*寻路查找连接路径
        const path = this.findPathAStar(block1, block2);
        if (path) {
            console.log('A*寻路找到路径');
            return path;
        }

        console.log('无法找到连接路径');
        return null;
    }

    // A*寻路算法
    private findPathAStar(block1: BlockData, block2: BlockData): PathPoint[] | null {
        console.log('A*寻路开始:', block1.row, block1.col, '->', block2.row, block2.col);

        // 打印当前网格状态
        this.printGridState();

        // 获取两个方块周围的空位置作为起点和终点
        const startPositions = this.getEmptyPositionsAround(block1);
        const endPositions = this.getEmptyPositionsAround(block2);

        console.log('起点候选位置:', startPositions);
        console.log('终点候选位置:', endPositions);

        // 尝试所有起点和终点的组合
        for (const startPos of startPositions) {
            for (const endPos of endPositions) {
                const path = this.findPathBetweenPositions(startPos, endPos);
                if (path) {
                    console.log('找到路径:', startPos, '->', endPos);
                    return this.buildFinalPath(path, block1, block2);
                }
            }
        }

        console.log('A*寻路失败');
        return null;
    }

    // 获取方块周围的空位置
    private getEmptyPositionsAround(block: BlockData): GridNode[] {
        const positions: GridNode[] = [];
        const gridRow = block.row + 1;
        const gridCol = block.col + 1;

        // 检查四个方向
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        for (const dir of directions) {
            const newRow = gridRow + dir.row;
            const newCol = gridCol + dir.col;

            // 检查边界
            if (newRow >= 0 && newRow < this.GRID_ROWS &&
                newCol >= 0 && newCol < this.GRID_COLS) {
                // 检查是否为空
                if (this.grid[newRow][newCol] !== 1) {
                    positions.push({ row: newRow, col: newCol });
                }
            }
        }

        return positions;
    }

    // 在两个位置之间寻找路径
    private findPathBetweenPositions(start: GridNode, end: GridNode): GridNode[] | null {
        const openSet: GridNode[] = [];
        const closedSet: Set<string> = new Set();
        const cameFrom: Map<string, GridNode> = new Map();
        const gScore: Map<string, number> = new Map();
        const fScore: Map<string, number> = new Map();

        openSet.push(start);
        gScore.set(this.nodeKey(start), 0);
        fScore.set(this.nodeKey(start), this.heuristic(start, end));

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
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (closedSet.has(this.nodeKey(neighbor))) {
                    continue;
                }

                const tentativeGScore = gScore.get(this.nodeKey(current)) + 1;

                if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(this.nodeKey(neighbor))) {
                    continue;
                }

                cameFrom.set(this.nodeKey(neighbor), current);
                gScore.set(this.nodeKey(neighbor), tentativeGScore);
                fScore.set(this.nodeKey(neighbor), tentativeGScore + this.heuristic(neighbor, end));
            }
        }

        return null;
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

    // 获取邻居节点
    private getNeighbors(node: GridNode): GridNode[] {
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

            // 检查边界
            if (newRow >= 0 && newRow < this.GRID_ROWS &&
                newCol >= 0 && newCol < this.GRID_COLS) {
                // 检查是否可以通行（空或边界）
                if (this.grid[newRow][newCol] !== 1) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
        }

        return neighbors;
    }

    // 启发式函数（曼哈顿距离）
    private heuristic(node: GridNode, goal: GridNode): number {
        return Math.abs(node.row - goal.row) + Math.abs(node.col - goal.col);
    }

    // 节点键值
    private nodeKey(node: GridNode): string {
        return `${node.row},${node.col}`;
    }

    // 绘制连线
    private drawConnectionLine(path: PathPoint[]) {
        console.log('绘制连线路径:', path);

        // 清除之前的连线
        this.graphics.clear();

        if (path.length < 2) return;

        this.graphics.strokeColor = Color.RED;
        this.graphics.lineWidth = 3;

        // 绘制路径
        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];

            // 转换为世界坐标
            const startPos = this.getWorldPosition(start.row, start.col);
            const endPos = this.getWorldPosition(end.row, end.col);

            console.log(`绘制线段 ${i}: (${start.row},${start.col}) -> (${end.row},${end.col})`);
            console.log(`世界坐标: (${startPos.x},${startPos.y}) -> (${endPos.x},${endPos.y})`);

            this.graphics.moveTo(startPos.x, startPos.y);
            this.graphics.lineTo(endPos.x, endPos.y);
        }

        this.graphics.stroke();
    }

    // 获取世界坐标
    private getWorldPosition(row: number, col: number): Vec3 {
        // 以content为中心计算起始位置
        const totalWidth = this.COLS * this.BLOCK_WIDTH + (this.COLS - 1) * this.BLOCK_SPACING;
        const totalHeight = this.ROWS * this.BLOCK_HEIGHT + (this.ROWS - 1) * this.BLOCK_SPACING;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        // 普通方块位置
        const x = startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING) + this.BLOCK_WIDTH / 2;
        const y = startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING) - this.BLOCK_HEIGHT / 2;
        return new Vec3(x, y, 0);
    }

    // 清除连线
    private clearLine() {
        if (this.graphics) {
            this.graphics.clear();
        }
    }

    // 打印网格状态（调试用）
    private printGridState() {
        console.log('当前网格状态:');
        for (let row = 0; row < this.GRID_ROWS; row++) {
            let rowStr = '';
            for (let col = 0; col < this.GRID_COLS; col++) {
                rowStr += this.grid[row][col] + ' ';
            }
            console.log(`行${row}: ${rowStr}`);
        }
    }

    // 检查是否相邻
    private isAdjacent(block1: BlockData, block2: BlockData): boolean {
        const rowDiff = Math.abs(block1.row - block2.row);
        const colDiff = Math.abs(block1.col - block2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
}