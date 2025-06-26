import { _decorator, Component, Node, Prefab, instantiate, Vec3, Color, Sprite, UITransform, input, Input, EventTouch, Vec2, tween, Tween, Graphics, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

// 方块类型枚举
enum BlockType {
    RED = 0,
    BLUE = 1,
    GREEN = 2,
    YELLOW = 3,
    PURPLE = 4
}

// 方块数据接口
interface BlockData {
    node: Node;
    type: BlockType;
    row: number;
    col: number;
    isSelected: boolean;
}

@ccclass('xxl')
export class xxl extends Component {
    @property(Node) private content: Node = null!;
    @property(Sprite) private block: Sprite = null!;

    // 游戏配置
    private readonly GRID_ROWS: number = 8;
    private readonly GRID_COLS: number = 8;
    private readonly BLOCK_SIZE: number = 85;
    private readonly BLOCK_TYPES: number = 5;

    // 游戏状态
    private gameBoard: BlockData[][] = [];
    private selectedBlock: BlockData | null = null;
    private isProcessing: boolean = false;
    private isDragging: boolean = false;
    private dragStartPos: Vec2 = new Vec2();
    private dragBlock: BlockData | null = null;
    private dragOriginalPos: Vec3 = new Vec3();
    private dragTargetBlock: BlockData | null = null;

    // 方块图片资源
    private blockSprites: SpriteFrame[] = [];

    // 方块颜色配置
    private readonly BLOCK_COLORS: Color[] = [
        new Color(255, 0, 0, 255),    // 红色
        new Color(0, 0, 255, 255),    // 蓝色
        new Color(0, 255, 0, 255),    // 绿色
        new Color(255, 255, 0, 255),  // 黄色
        new Color(255, 0, 255, 255)   // 紫色
    ];

    start() {
        this.loadBlockSprites();
    }

    /**
     * 加载方块图片资源
     */
    private loadBlockSprites(): void {
        this.blockSprites = [];
        let loadedCount = 0;

        for (let i = 1; i <= 5; i++) {
            resources.load(`xxl/${i}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error(`Failed to load block sprite ${i}:`, err);
                } else {
                    this.blockSprites[i - 1] = spriteFrame;
                }

                loadedCount++;
                if (loadedCount === 5) {
                    // 所有资源加载完成后初始化游戏
                    this.initGame();
                    this.setupInput();
                }
            });
        }
    }

    /**
     * 初始化游戏
     */
    private initGame(): void {
        this.createGameBoard();
        this.generateInitialBlocks();
    }

    /**
     * 创建游戏网格
     */
    private createGameBoard(): void {
        this.gameBoard = [];

        // 计算起始位置，使网格居中
        const startX = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2;
        const startY = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;

        console.log('Grid start position:', startX, startY);

        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.gameBoard[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const blockNode = this.createBlockNode();
                const x = startX + col * this.BLOCK_SIZE;
                const y = startY - row * this.BLOCK_SIZE;

                // 使用本地坐标设置位置
                blockNode.setPosition(x, y, 0);

                // console.log(`Created block at row ${row}, col ${col}, pos: (${x}, ${y})`);

                this.gameBoard[row][col] = {
                    node: blockNode,
                    type: BlockType.RED,
                    row: row,
                    col: col,
                    isSelected: false
                };
            }
        }
    }

    /**
     * 创建方块节点
     */
    private createBlockNode(): Node {
        const blockNode = instantiate(this.block.node);
        blockNode.setParent(this.content);
        blockNode.active = true;

        // 设置Layer层
        blockNode.layer = this.content.layer;

        // 设置大小
        const transform = blockNode.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.BLOCK_SIZE, this.BLOCK_SIZE);
        }

        return blockNode;
    }

    /**
     * 方块触摸事件
     */
    private onBlockTouch(blockNode: Node, event: EventTouch): void {
        // 阻止事件冒泡，让全局触摸事件处理
        event.propagationStopped = true;
    }

    /**
     * 生成初始方块
     */
    private generateInitialBlocks(): void {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                let blockType: BlockType;
                do {
                    blockType = Math.floor(Math.random() * this.BLOCK_TYPES);
                } while (this.wouldCreateMatch(row, col, blockType));

                this.setBlockType(row, col, blockType);
            }
        }
    }

    /**
     * 检查是否会产生匹配
     */
    private wouldCreateMatch(row: number, col: number, type: BlockType): boolean {
        // 检查水平方向
        let horizontalCount = 1;
        for (let i = col - 1; i >= 0; i--) {
            if (this.gameBoard[row][i].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }
        for (let i = col + 1; i < this.GRID_COLS; i++) {
            if (this.gameBoard[row][i].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }

        // 检查垂直方向
        let verticalCount = 1;
        for (let i = row - 1; i >= 0; i--) {
            if (this.gameBoard[i][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }
        for (let i = row + 1; i < this.GRID_ROWS; i++) {
            if (this.gameBoard[i][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }

        return horizontalCount >= 3 || verticalCount >= 3;
    }

    /**
     * 设置方块类型
     */
    private setBlockType(row: number, col: number, type: BlockType): void {
        const blockData = this.gameBoard[row][col];
        blockData.type = type;

        const sprite = blockData.node.getComponent(Sprite);
        if (sprite && this.blockSprites[type]) {
            sprite.spriteFrame = this.blockSprites[type];
        }
    }

    /**
     * 设置输入事件
     */
    private setupInput(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * 触摸开始事件
     */
    private onTouchStart(event: EventTouch): void {
        if (this.isProcessing) {
            return;
        }

        const touchPos = event.getUILocation();
        const blockData = this.getBlockAtPosition(touchPos);

        if (blockData) {
            // 启动拖拽
            this.isDragging = true;
            this.dragBlock = blockData;
            this.dragStartPos = touchPos;
            this.dragOriginalPos = blockData.node.getPosition();
            this.dragTargetBlock = null;
        }
    }

    /**
     * 根据位置获取方块
     */
    private getBlockAtPosition(worldPos: Vec2): BlockData | null {
        // 直接使用UI坐标比较
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const blockData = this.gameBoard[row][col];
                const blockWorldPos = blockData.node.getWorldPosition();

                const distance = Vec2.distance(
                    new Vec2(blockWorldPos.x, blockWorldPos.y),
                    worldPos
                );

                if (distance <= this.BLOCK_SIZE / 2) {
                    return blockData;
                }
            }
        }

        return null;
    }

    /**
     * 触摸移动事件
     */
    private onTouchMove(event: EventTouch): void {
        if (!this.isDragging || !this.dragBlock) {
            return;
        }

        const touchPos = event.getUILocation();

        // 计算相对于起始位置的偏移
        const deltaX = touchPos.x - this.dragStartPos.x;
        const deltaY = touchPos.y - this.dragStartPos.y;

        // 确定主要移动方向
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        let moveX = 0;
        let moveY = 0;
        let moveDirection = '';

        if (absDeltaX > absDeltaY) {
            // 水平移动
            moveX = deltaX;
            moveY = 0;
            moveDirection = deltaX > 0 ? 'right' : 'left';
        } else {
            // 垂直移动
            moveX = 0;
            moveY = deltaY;
            moveDirection = deltaY > 0 ? 'up' : 'down';
        }

        // 限制移动距离，不能超过一个方块的距离
        const maxMove = this.BLOCK_SIZE;
        if (Math.abs(moveX) > maxMove) {
            moveX = moveX > 0 ? maxMove : -maxMove;
        }
        if (Math.abs(moveY) > maxMove) {
            moveY = moveY > 0 ? maxMove : -maxMove;
        }

        // 计算新位置（基于原始位置）
        const newX = this.dragOriginalPos.x + moveX;
        const newY = this.dragOriginalPos.y + moveY;

        // 设置拖拽方块位置
        this.dragBlock.node.setPosition(newX, newY, 0);

        // 找到相邻方块并同步移动
        const adjacentBlock = this.getAdjacentBlockByDirection(this.dragBlock, moveDirection);
        if (adjacentBlock) {
            // 计算相邻方块的新位置（反向移动）
            const adjacentOriginalPos = this.getBlockOriginalPosition(adjacentBlock);
            const adjacentNewX = adjacentOriginalPos.x - moveX;
            const adjacentNewY = adjacentOriginalPos.y - moveY;

            adjacentBlock.node.setPosition(adjacentNewX, adjacentNewY, 0);
        }
    }

    /**
     * 根据方向获取相邻方块
     */
    private getAdjacentBlockByDirection(block: BlockData, direction: string): BlockData | null {
        let targetRow = block.row;
        let targetCol = block.col;

        switch (direction) {
            case 'up':
                targetRow = Math.max(0, block.row - 1);
                break;
            case 'down':
                targetRow = Math.min(this.GRID_ROWS - 1, block.row + 1);
                break;
            case 'left':
                targetCol = Math.max(0, block.col - 1);
                break;
            case 'right':
                targetCol = Math.min(this.GRID_COLS - 1, block.col + 1);
                break;
        }

        if (targetRow !== block.row || targetCol !== block.col) {
            return this.gameBoard[targetRow][targetCol];
        }

        return null;
    }

    /**
     * 获取方块的原始位置
     */
    private getBlockOriginalPosition(block: BlockData): Vec3 {
        const startX = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2;
        const startY = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;
        const x = startX + block.col * this.BLOCK_SIZE;
        const y = startY - block.row * this.BLOCK_SIZE;
        return new Vec3(x, y, 0);
    }

    /**
     * 触摸结束事件
     */
    private onTouchEnd(event: EventTouch): void {
        if (!this.isDragging || !this.dragBlock) return;

        // 检测拖拽方块是否与相邻方块重叠
        const dragBlockWorldPos = this.dragBlock.node.getWorldPosition();
        let closestBlock: BlockData | null = null;
        let minDistance = Infinity;

        // 检查所有相邻方块
        const adjacentBlocks = this.getAdjacentBlocks(this.dragBlock);
        for (const adjacentBlock of adjacentBlocks) {
            const adjacentWorldPos = adjacentBlock.node.getWorldPosition();
            const distance = Vec2.distance(
                new Vec2(dragBlockWorldPos.x, dragBlockWorldPos.y),
                new Vec2(adjacentWorldPos.x, adjacentWorldPos.y)
            );

            if (distance < minDistance && distance < this.BLOCK_SIZE) {
                minDistance = distance;
                closestBlock = adjacentBlock;
            }
        }

        if (closestBlock) {
            // 尝试交换，让trySwapBlocks处理所有复位逻辑
            console.log('Attempting swap with closest block:', closestBlock.row, closestBlock.col);
            this.trySwapBlocks(this.dragBlock, closestBlock);
        } else {
            // 没有找到相邻方块，直接复位
            this.resetDragBlock();
            this.resetAdjacentBlock();
        }

        this.isDragging = false;
        this.dragBlock = null;
        this.dragTargetBlock = null;
    }

    /**
     * 复位相邻方块
     */
    private resetAdjacentBlock(): void {
        // 找到所有相邻方块并复位
        const adjacentBlocks = this.getAdjacentBlocks(this.dragBlock!);
        for (const adjacentBlock of adjacentBlocks) {
            const originalPos = this.getBlockOriginalPosition(adjacentBlock);
            tween(adjacentBlock.node)
                .to(0.2, { position: originalPos })
                .start();
        }
    }

    /**
     * 获取所有相邻方块
     */
    private getAdjacentBlocks(block: BlockData): BlockData[] {
        const adjacentBlocks: BlockData[] = [];

        // 上
        if (block.row > 0) {
            adjacentBlocks.push(this.gameBoard[block.row - 1][block.col]);
        }
        // 下
        if (block.row < this.GRID_ROWS - 1) {
            adjacentBlocks.push(this.gameBoard[block.row + 1][block.col]);
        }
        // 左
        if (block.col > 0) {
            adjacentBlocks.push(this.gameBoard[block.row][block.col - 1]);
        }
        // 右
        if (block.col < this.GRID_COLS - 1) {
            adjacentBlocks.push(this.gameBoard[block.row][block.col + 1]);
        }

        return adjacentBlocks;
    }

    /**
     * 开始拖拽动画
     */
    private startDragAnimation(): void {
        if (!this.dragBlock || !this.dragTargetBlock) return;

        // 获取两个方块的原始位置
        const pos1 = this.dragBlock.node.getPosition();
        const pos2 = this.dragTargetBlock.node.getPosition();

        console.log('Drag animation - pos1:', pos1, 'pos2:', pos2);

        // 交换位置动画
        tween(this.dragBlock.node)
            .to(0.2, { position: pos2 })
            .start();

        tween(this.dragTargetBlock.node)
            .to(0.2, { position: pos1 })
            .start();
    }

    /**
     * 复位拖拽方块
     */
    private resetDragBlock(): void {
        if (!this.dragBlock) return;

        // 计算方块应该的本地坐标位置
        const startX = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2;
        const startY = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;
        const x = startX + this.dragBlock.col * this.BLOCK_SIZE;
        const y = startY - this.dragBlock.row * this.BLOCK_SIZE;

        tween(this.dragBlock.node)
            .to(0.2, { position: new Vec3(x, y, 0) })
            .start();
    }

    /**
     * 尝试交换方块
     */
    private async trySwapBlocks(block1: BlockData, block2: BlockData): Promise<void> {
        this.isProcessing = true;

        console.log(`开始交换: 方块1(${block1.row},${block1.col}) 类型${block1.type}, 方块2(${block2.row},${block2.col}) 类型${block2.type}`);

        // 如果是拖拽交换，需要先复位位置
        if (this.isDragging) {
            // 复位拖拽的方块
            const block1OriginalPos = this.getBlockOriginalPosition(block1);
            const block2OriginalPos = this.getBlockOriginalPosition(block2);

            // 直接设置位置，不使用动画
            block1.node.setPosition(block1OriginalPos);
            block2.node.setPosition(block2OriginalPos);
        }

        // 执行交换动画
        await this.swapBlocksAnimation(block1, block2);

        console.log(`交换完成，检查消除...`);

        // 检查是否可以消除
        const canEliminate = this.checkForMatches();

        console.log(`消除检查结果: ${canEliminate}`);

        if (canEliminate) {
            // 可以消除，执行消除流程
            console.log(`开始消除流程`);
            await this.eliminateMatches();
        } else {
            // 不能消除，直接复位到原始位置（不调用动画，直接设置位置）
            console.log(`不能消除，复位方块`);
            this.swapBlockData(block1, block2);
            const block1OriginalPos = this.getBlockOriginalPosition(block1);
            const block2OriginalPos = this.getBlockOriginalPosition(block2);
            block1.node.setPosition(block1OriginalPos);
            block2.node.setPosition(block2OriginalPos);
        }

        this.isProcessing = false;
    }

    /**
     * 交换方块动画
     */
    private async swapBlocksAnimation(block1: BlockData, block2: BlockData): Promise<void> {
        const pos1 = block1.node.getPosition();
        const pos2 = block2.node.getPosition();

        return new Promise<void>((resolve) => {
            let completed = 0;

            const checkComplete = () => {
                completed++;
                if (completed === 2) {
                    // 交换完成后更新游戏板数据结构
                    this.swapBlockData(block1, block2);
                    resolve();
                }
            };

            // 执行交换动画
            tween(block1.node)
                .to(0.3, { position: pos2 })
                .call(checkComplete)
                .start();

            tween(block2.node)
                .to(0.3, { position: pos1 })
                .call(checkComplete)
                .start();
        });
    }

    /**
     * 交换方块数据
     */
    private swapBlockData(block1: BlockData, block2: BlockData): void {
        // 保存原始位置
        const block1Row = block1.row;
        const block1Col = block1.col;
        const block2Row = block2.row;
        const block2Col = block2.col;

        // 交换游戏板中的位置
        this.gameBoard[block1Row][block1Col] = block2;
        this.gameBoard[block2Row][block2Col] = block1;

        // 更新方块的行列信息
        block1.row = block2Row;
        block1.col = block2Col;
        block2.row = block1Row;
        block2.col = block1Col;
    }

    /**
     * 检查是否有匹配
     */
    private checkForMatches(): boolean {
        const matches = this.findMatches();
        return matches.length > 0;
    }

    /**
     * 查找所有匹配
     */
    private findMatches(): BlockData[][] {
        const matches: BlockData[][] = [];

        // 检查水平匹配
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS - 2; col++) {
                const type = this.gameBoard[row][col].type;
                if (this.gameBoard[row][col + 1].type === type &&
                    this.gameBoard[row][col + 2].type === type) {
                    const match: BlockData[] = [];
                    let i = col;
                    while (i < this.GRID_COLS && this.gameBoard[row][i].type === type) {
                        match.push(this.gameBoard[row][i]);
                        i++;
                    }
                    matches.push(match);
                    console.log(`水平匹配: 行${row}, 列${col}-${i - 1}, 类型${type}, 长度${match.length}`);
                    col = i - 1; // 跳过已匹配的方块
                }
            }
        }

        // 检查垂直匹配
        for (let col = 0; col < this.GRID_COLS; col++) {
            for (let row = 0; row < this.GRID_ROWS - 2; row++) {
                const type = this.gameBoard[row][col].type;
                if (this.gameBoard[row + 1][col].type === type &&
                    this.gameBoard[row + 2][col].type === type) {
                    const match: BlockData[] = [];
                    let i = row;
                    while (i < this.GRID_ROWS && this.gameBoard[i][col].type === type) {
                        match.push(this.gameBoard[i][col]);
                        i++;
                    }
                    matches.push(match);
                    console.log(`垂直匹配: 列${col}, 行${row}-${i - 1}, 类型${type}, 长度${match.length}`);
                    row = i - 1; // 跳过已匹配的方块
                }
            }
        }

        console.log(`总共找到 ${matches.length} 个匹配`);
        return matches;
    }

    /**
     * 消除匹配的方块
     */
    private async eliminateMatches(): Promise<void> {
        const matches = this.findMatches();

        // 标记要消除的方块
        const blocksToRemove = new Set<BlockData>();
        matches.forEach(match => {
            match.forEach(block => blocksToRemove.add(block));
        });

        // 消除动画
        await this.removeBlocksAnimation(Array.from(blocksToRemove));

        // 下落
        await this.dropBlocks();

        // 填充新方块
        await this.fillNewBlocks();

        // 检查是否还有新的匹配
        if (this.checkForMatches()) {
            await this.eliminateMatches();
        }
    }

    /**
     * 消除方块动画
     */
    private async removeBlocksAnimation(blocks: BlockData[]): Promise<void> {
        return new Promise<void>((resolve) => {
            let completed = 0;

            blocks.forEach(block => {
                tween(block.node)
                    .to(0.2, { scale: new Vec3(0, 0, 0) })
                    .call(() => {
                        completed++;
                        if (completed === blocks.length) resolve();
                    })
                    .start();
            });
        });
    }

    /**
     * 方块下落
     */
    private async dropBlocks(): Promise<void> {
        for (let col = 0; col < this.GRID_COLS; col++) {
            let emptyRow = this.GRID_ROWS - 1;

            for (let row = this.GRID_ROWS - 1; row >= 0; row--) {
                const blockData = this.gameBoard[row][col];
                if (blockData.node.scale.x > 0) {
                    // 方块存在，移动到空位
                    if (emptyRow !== row) {
                        this.gameBoard[emptyRow][col] = blockData;
                        this.gameBoard[row][col] = null!;
                        blockData.row = emptyRow;

                        const targetY = (this.GRID_ROWS - 1 - emptyRow) * this.BLOCK_SIZE - (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;
                        tween(blockData.node)
                            .to(0.3, { position: new Vec3(blockData.node.position.x, targetY, 0) })
                            .start();
                    }
                    emptyRow--;
                }
            }

            // 清理空位
            for (let row = emptyRow; row >= 0; row--) {
                this.gameBoard[row][col] = null!;
            }
        }

        // 等待下落动画完成
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    /**
     * 填充新方块
     */
    private async fillNewBlocks(): Promise<void> {
        for (let col = 0; col < this.GRID_COLS; col++) {
            for (let row = 0; row < this.GRID_ROWS; row++) {
                if (!this.gameBoard[row][col]) {
                    const blockNode = this.createBlockNode();
                    const startX = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + col * this.BLOCK_SIZE;
                    const startY = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 + this.BLOCK_SIZE * 2; // 从上方开始
                    const targetY = (this.GRID_ROWS - 1 - row) * this.BLOCK_SIZE - (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;

                    blockNode.setPosition(startX, startY, 0);
                    blockNode.setScale(new Vec3(0, 0, 1));

                    const blockType = Math.floor(Math.random() * this.BLOCK_TYPES);
                    const blockData: BlockData = {
                        node: blockNode,
                        type: blockType,
                        row: row,
                        col: col,
                        isSelected: false
                    };

                    this.gameBoard[row][col] = blockData;
                    this.setBlockType(row, col, blockType);

                    // 下落动画
                    tween(blockNode)
                        .to(0.3, {
                            position: new Vec3(startX, targetY, 0),
                            scale: new Vec3(1, 1, 1)
                        })
                        .start();
                }
            }
        }

        // 等待填充动画完成
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}


