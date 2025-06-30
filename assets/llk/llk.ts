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

    // 游戏状态
    private blocks: BlockData[][] = [];
    private selectedBlocks: BlockData[] = [];
    private blockTypes: number[] = [];
    private spriteFrames: SpriteFrame[] = [];
    private lineNode: Node = null!;
    private graphics: Graphics = null!;

    start() {
        this.initGame();
    }

    private async initGame() {
        await this.loadResources();
        this.calculateBlockSize();
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
        // 清空现有方块，但保留LineNode
        const children = this.content.children;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child.name !== 'LineNode') {
                child.destroy();
            }
        }

        this.blocks = [];
        this.selectedBlocks = [];

        // 计算起始位置
        const startX = -(this.COLS - 1) * (this.BLOCK_WIDTH + this.BLOCK_SPACING) / 2;
        const startY = (this.ROWS - 1) * (this.BLOCK_HEIGHT + this.BLOCK_SPACING) / 2;

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

                // 设置位置
                const x = startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING);
                const y = startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING);
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
        // 消除选中的方块
        this.selectedBlocks.forEach(block => {
            block.node.destroy();
            this.blocks[block.row][block.col] = null!;
        });

        this.selectedBlocks = [];

        // 检查游戏是否结束
        this.checkGameEnd();
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

        // 2. 检查无遮挡连线连接
        const connectionPath = this.findOpenDirectionConnection(block1, block2);
        if (connectionPath) {
            console.log('无遮挡连线连接可行');
            return connectionPath;
        }

        console.log('无法找到连接路径');
        return null;
    }

    // 查找无遮挡方向连接
    private findOpenDirectionConnection(block1: BlockData, block2: BlockData): PathPoint[] | null {
        // 获取两个方块的无遮挡方向
        const directions1 = this.getOpenDirections(block1);
        const directions2 = this.getOpenDirections(block2);

        console.log('方块1无遮挡方向:', directions1);
        console.log('方块2无遮挡方向:', directions2);

        // 检查所有可能的无遮挡方向组合
        for (const dir1 of directions1) {
            if (dir1.isOpen) {
                for (const dir2 of directions2) {
                    if (dir2.isOpen) {
                        // 尝试通过这两个方向连接
                        const path = this.tryConnectViaDirections(block1, block2, dir1.direction, dir2.direction);
                        if (path) {
                            console.log('找到无遮挡方向连接:', dir1.direction, '->', dir2.direction);
                            return path;
                        }
                    }
                }
            }
        }

        return null;
    }

    // 尝试通过指定方向连接两个方块
    private tryConnectViaDirections(block1: BlockData, block2: BlockData, dir1: string, dir2: string): PathPoint[] | null {
        // 获取两个方块在指定方向的延伸点
        const point1 = this.getExtendedPoint(block1, dir1);
        const point2 = this.getExtendedPoint(block2, dir2);

        // 检查这两个延伸点之间是否可以连接
        if (this.canConnectPoints(point1, point2)) {
            return [
                { row: block1.row, col: block1.col },
                point1,
                point2,
                { row: block2.row, col: block2.col }
            ];
        }

        return null;
    }

    // 获取方块在指定方向的延伸点
    private getExtendedPoint(block: BlockData, direction: string): PathPoint {
        const { row, col } = block;

        switch (direction) {
            case 'up':
                return { row: -1, col: col }; // 上边界
            case 'down':
                return { row: this.ROWS, col: col }; // 下边界
            case 'left':
                return { row: row, col: -1 }; // 左边界
            case 'right':
                return { row: row, col: this.COLS }; // 右边界
            default:
                return { row: row, col: col };
        }
    }

    // 检查两个点之间是否可以连接
    private canConnectPoints(point1: PathPoint, point2: PathPoint): boolean {
        // 如果两个点都是边界点，应该通过边界连接检查
        if (this.isBoundaryPoint(point1) && this.isBoundaryPoint(point2)) {
            return this.canConnectBoundaryPoints(point1, point2);
        }

        // 如果只有一个点是边界点，也可以连接
        if (this.isBoundaryPoint(point1) || this.isBoundaryPoint(point2)) {
            return true;
        }

        // 普通点之间的连接，目前简化处理
        return true;
    }

    // 检查是否是边界点
    private isBoundaryPoint(point: PathPoint): boolean {
        return point.row === -1 || point.row === this.ROWS ||
            point.col === -1 || point.col === this.COLS;
    }

    // 检查边界点之间的连接
    private canConnectBoundaryPoints(point1: PathPoint, point2: PathPoint): boolean {
        // 如果两个点在同一边界，直接可以连接
        if (point1.row === point2.row && (point1.row === -1 || point1.row === this.ROWS)) {
            return true; // 上下边界
        }
        if (point1.col === point2.col && (point1.col === -1 || point1.col === this.COLS)) {
            return true; // 左右边界
        }

        // 如果两个点在不同边界，检查拐角点
        return this.canConnectViaCorner(point1, point2);
    }

    // 检查通过拐角连接
    private canConnectViaCorner(point1: PathPoint, point2: PathPoint): boolean {
        // 尝试找到拐角点
        const cornerPoints = [
            { row: point1.row, col: point2.col },
            { row: point2.row, col: point1.col }
        ];

        for (const corner of cornerPoints) {
            if (this.isValidCorner(corner)) {
                return true;
            }
        }

        return false;
    }

    // 检查是否是有效的拐角点
    private isValidCorner(point: PathPoint): boolean {
        // 拐角点必须在边界上且不在游戏区域内
        return (point.row === -1 || point.row === this.ROWS ||
            point.col === -1 || point.col === this.COLS);
    }

    // 检查普通点之间的直线连接
    private canConnectDirectlyPoints(point1: PathPoint, point2: PathPoint): boolean {
        // 如果两个点都是边界点，应该通过边界连接检查
        if (this.isBoundaryPoint(point1) && this.isBoundaryPoint(point2)) {
            return this.canConnectBoundaryPoints(point1, point2);
        }

        // 如果只有一个点是边界点，也可以连接
        if (this.isBoundaryPoint(point1) || this.isBoundaryPoint(point2)) {
            return true;
        }

        // 普通点之间的连接，目前简化处理
        return true;
    }

    // 检查是否相邻
    private isAdjacent(block1: BlockData, block2: BlockData): boolean {
        const rowDiff = Math.abs(block1.row - block2.row);
        const colDiff = Math.abs(block1.col - block2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 检查方块四周是否有无遮挡方向
    private getOpenDirections(block: BlockData): { direction: string, isOpen: boolean }[] {
        const { row, col } = block;
        const directions = [
            { direction: 'up', isOpen: row > 0 && !this.blocks[row - 1][col] },
            { direction: 'down', isOpen: row < this.ROWS - 1 && !this.blocks[row + 1][col] },
            { direction: 'left', isOpen: col > 0 && !this.blocks[row][col - 1] },
            { direction: 'right', isOpen: col < this.COLS - 1 && !this.blocks[row][col + 1] }
        ];

        // 边界方块可以向边界方向延伸
        if (row === 0) {
            directions[0].isOpen = true; // 上边界可以向上延伸
        }
        if (row === this.ROWS - 1) {
            directions[1].isOpen = true; // 下边界可以向下延伸
        }
        if (col === 0) {
            directions[2].isOpen = true; // 左边界可以向左延伸
        }
        if (col === this.COLS - 1) {
            directions[3].isOpen = true; // 右边界可以向右延伸
        }

        console.log(`方块(${row},${col})四周情况:`, directions);
        return directions;
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
        // 计算起始位置（与createBlocks方法保持一致）
        const startX = -(this.COLS - 1) * (this.BLOCK_WIDTH + this.BLOCK_SPACING) / 2;
        const startY = (this.ROWS - 1) * (this.BLOCK_HEIGHT + this.BLOCK_SPACING) / 2;

        // 对于边界点，计算延伸位置
        if (row === -1) {
            // 上边界，向上延伸15像素
            return new Vec3(
                startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING),
                startY + 15,
                0
            );
        } else if (row === this.ROWS) {
            // 下边界，向下延伸15像素
            return new Vec3(
                startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING),
                startY - this.ROWS * (this.BLOCK_HEIGHT + this.BLOCK_SPACING) - 15,
                0
            );
        } else if (col === -1) {
            // 左边界，向左延伸15像素
            return new Vec3(
                startX - 15,
                startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING),
                0
            );
        } else if (col === this.COLS) {
            // 右边界，向右延伸15像素
            return new Vec3(
                startX + this.COLS * (this.BLOCK_WIDTH + this.BLOCK_SPACING) + 15,
                startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING),
                0
            );
        } else {
            // 普通方块位置
            const x = startX + col * (this.BLOCK_WIDTH + this.BLOCK_SPACING);
            const y = startY - row * (this.BLOCK_HEIGHT + this.BLOCK_SPACING);
            return new Vec3(x, y, 0);
        }
    }

    // 清除连线
    private clearLine() {
        if (this.graphics) {
            this.graphics.clear();
        }
    }
}