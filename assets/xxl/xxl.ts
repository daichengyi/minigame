import { _decorator, Component, Node, Sprite, UITransform, instantiate, Vec3, input, Input, EventTouch, Vec2, tween, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;
import { BoardModel } from './model/BoardModel';
import { BlockData } from './model/BlockData';
import { BlockType, BlockTypeUtil } from './model/BlockType';
import { DragDirection, DragDirectionUtil } from './model/DragDirection';
import { GameLogic } from './service/GameLogic';

@ccclass('xxl')
export class xxl extends Component {
    @property(Node) private content: Node = null!;
    @property(Sprite) private block: Sprite = null!;

    // 游戏配置
    private readonly GRID_ROWS = 8;
    private readonly GRID_COLS = 8;
    private readonly BLOCK_SIZE = 85;
    private readonly BLOCK_TYPES = BlockTypeUtil.getTypeCount();
    private readonly MIN_DRAG_DISTANCE = 20; // 增加拖拽阈值

    // 方向常量 - 使用工具类
    private static readonly DIRECTIONS = DragDirectionUtil.getAllDirections().map(direction => ({
        direction,
        ...DragDirectionUtil.getDirectionOffset(direction)
    }));

    // 游戏状态
    private boardModel: BoardModel;
    private gameLogic: GameLogic;
    private blockSprites: SpriteFrame[] = [];
    private blockNodeMap: Map<BlockData, Node> = new Map();
    private dragBlock: BlockData | null = null;
    private dragStartPos: Vec2 = new Vec2();
    private dragOriginalPos: Vec3 = new Vec3();
    private adjacentBlock: BlockData | null = null;
    private adjacentOriginalPos: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private isProcessing: boolean = false;
    private dragDirection: DragDirection = DragDirection.UP;

    // 位置计算缓存
    private readonly positionCache: Vec3[][] = [];

    /**
     * 组件启动时调用
     */
    start() {
        this.loadBlockSprites();
    }

    /**
     * 加载方块图片资源
     */
    private loadBlockSprites() {
        this.blockSprites = [];
        let loadedCount = 0;
        for (let i = 1; i <= this.BLOCK_TYPES; i++) {
            resources.load(`xxl/${i}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (!err && spriteFrame) {
                    this.blockSprites[i - 1] = spriteFrame;
                }
                loadedCount++;
                if (loadedCount === this.BLOCK_TYPES) {
                    this.initGame();
                    this.setupInput();
                }
            });
        }
    }

    /**
     * 初始化游戏
     */
    private initGame() {
        this.boardModel = new BoardModel(this.GRID_ROWS, this.GRID_COLS, this.BLOCK_TYPES);
        this.gameLogic = new GameLogic(this.boardModel);
        this.initPositionCache();
        this.generateInitialBlocks();
        this.renderBoard();
    }

    /**
     * 初始化位置缓存
     */
    private initPositionCache() {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.positionCache[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const x = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + col * this.BLOCK_SIZE;
                const y = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 - row * this.BLOCK_SIZE;
                this.positionCache[row][col] = new Vec3(x, y, 0);
            }
        }
    }

    /**
     * 生成初始方块
     */
    private generateInitialBlocks() {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                let type: BlockType;
                do {
                    type = BlockTypeUtil.getRandomType();
                } while (this.wouldCreateMatch(row, col, type));
                this.boardModel.setBlock(row, col, new BlockData(type, row, col));
            }
        }
    }

    /**
     * 检查是否会产生初始匹配
     */
    private wouldCreateMatch(row: number, col: number, type: BlockType): boolean {
        // 检查左侧
        let count = 1;
        for (let i = 1; i <= 2; i++) {
            if (col - i >= 0 && this.boardModel.getBlock(row, col - i)?.type === type) count++;
            else break;
        }
        if (count >= 3) return true;

        // 检查上方
        count = 1;
        for (let i = 1; i <= 2; i++) {
            if (row - i >= 0 && this.boardModel.getBlock(row - i, col)?.type === type) count++;
            else break;
        }
        return count >= 3;
    }

    /**
     * 渲染游戏棋盘
     */
    private renderBoard() {
        this.blockNodeMap.clear();
        this.content.removeAllChildren();
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const block = this.boardModel.getBlock(row, col);
                if (block) {
                    const node = this.createBlockNode(block);
                    this.blockNodeMap.set(block, node);
                }
            }
        }
    }

    /**
     * 创建方块节点
     */
    private createBlockNode(block: BlockData): Node {
        const node = instantiate(this.block.node);
        node.setParent(this.content);
        node.active = true;

        const transform = node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.BLOCK_SIZE, this.BLOCK_SIZE);
        }

        // 使用缓存的位置
        const position = this.getBlockOriginalPosition(block);
        node.setPosition(position.x, position.y, 0);

        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.spriteFrame = this.blockSprites[block.type];

        return node;
    }

    /**
     * 设置输入事件监听
     */
    private setupInput() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * 根据触摸位置获取方块
     */
    private getBlockAtPosition(worldPos: Vec2): BlockData | null {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const block = this.boardModel.getBlock(row, col);
                if (!block) continue;

                const node = this.blockNodeMap.get(block);
                if (!node) continue;

                const blockWorldPos = node.getWorldPosition();
                const distance = Vec2.distance(new Vec2(blockWorldPos.x, blockWorldPos.y), worldPos);
                if (distance <= this.BLOCK_SIZE / 2) return block;
            }
        }
        return null;
    }

    /**
     * 触摸开始事件
     */
    private onTouchStart(event: EventTouch) {
        if (this.isProcessing) return;

        const touchPos = event.getUILocation();
        const block = this.getBlockAtPosition(touchPos);
        if (block) {
            // 检查是否有可交换的相邻方块
            const hasAdjacentBlock = this.hasAdjacentBlock(block);
            if (!hasAdjacentBlock) {
                return; // 没有相邻方块，不允许拖拽
            }

            this.isDragging = false;
            this.dragBlock = block;
            this.dragStartPos = touchPos;
            this.dragDirection = DragDirection.UP;
            this.adjacentBlock = null;

            const node = this.blockNodeMap.get(block);
            if (node) this.dragOriginalPos = node.getPosition();
        }
    }

    /**
     * 获取指定方向的相邻方块或检查是否存在
     * @param block 要检查的方块
     * @param direction 指定方向
     * @param returnBlock 是否返回方块对象，false则只返回是否存在
     * @returns 方块对象或布尔值
     */
    private getAdjacentBlockByDirection(block: BlockData, direction: DragDirection, returnBlock: boolean = true): BlockData | boolean | null {
        const dir = xxl.DIRECTIONS.find(d => d.direction === direction);
        if (!dir) return returnBlock ? null : false;

        const targetRow = block.row + dir.row;
        const targetCol = block.col + dir.col;

        if (targetRow >= 0 && targetRow < this.GRID_ROWS &&
            targetCol >= 0 && targetCol < this.GRID_COLS) {
            const adjacentBlock = this.boardModel.getBlock(targetRow, targetCol);
            return returnBlock ? adjacentBlock : (adjacentBlock !== null);
        }
        return returnBlock ? null : false;
    }

    /**
     * 检查方块是否有相邻方块
     * @param block 要检查的方块
     * @param direction 指定方向，如果为null则检查所有方向
     * @returns 是否有相邻方块
     */
    private hasAdjacentBlock(block: BlockData, direction?: DragDirection): boolean {
        if (direction) {
            // 检查指定方向
            return this.getAdjacentBlockByDirection(block, direction, false) as boolean;
        } else {
            // 检查所有方向
            for (const dir of xxl.DIRECTIONS) {
                if (this.getAdjacentBlockByDirection(block, dir.direction, false) as boolean) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * 触摸移动事件
     */
    private onTouchMove(event: EventTouch) {
        if (!this.dragBlock) return;

        const touchPos = event.getUILocation();
        const deltaX = touchPos.x - this.dragStartPos.x;
        const deltaY = touchPos.y - this.dragStartPos.y;
        const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 确定当前拖拽方向
        let currentDirection = DragDirection.UP;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
            currentDirection = deltaX > 0 ? DragDirection.RIGHT : DragDirection.LEFT;
        } else {
            currentDirection = deltaY > 0 ? DragDirection.UP : DragDirection.DOWN;
        }

        if (!this.isDragging && totalDistance >= this.MIN_DRAG_DISTANCE) {
            // 检查该方向是否有相邻方块
            if (this.hasAdjacentBlock(this.dragBlock, currentDirection)) {
                this.isDragging = true;
                this.dragDirection = currentDirection;
                // 保存相邻方块信息
                this.adjacentBlock = this.getAdjacentBlockByDirection(this.dragBlock, currentDirection) as BlockData;
                if (this.adjacentBlock) {
                    this.adjacentOriginalPos = this.getBlockOriginalPosition(this.adjacentBlock);
                }
            }
        }

        if (!this.isDragging) {
            return;
        }

        // 检查方向是否改变
        if (this.dragDirection !== currentDirection) {
            // 方向改变了，先复位上一个方向的相邻方块
            if (this.adjacentBlock) {
                const adjacentNode = this.blockNodeMap.get(this.adjacentBlock);
                if (adjacentNode) {
                    adjacentNode.setPosition(this.adjacentOriginalPos.x, this.adjacentOriginalPos.y, 0);
                }
            }

            // 检查新方向是否有相邻方块
            if (this.hasAdjacentBlock(this.dragBlock, currentDirection)) {
                this.dragDirection = currentDirection;
                // 更新相邻方块信息
                this.adjacentBlock = this.getAdjacentBlockByDirection(this.dragBlock, currentDirection) as BlockData;
                if (this.adjacentBlock) {
                    this.adjacentOriginalPos = this.getBlockOriginalPosition(this.adjacentBlock);
                }
            } else {
                // 新方向没有相邻方块，保持原方向
                return;
            }
        }

        // 限制只能沿一个方向拖拽
        let moveX = 0;
        let moveY = 0;
        const maxMove = this.BLOCK_SIZE;

        switch (this.dragDirection) {
            case DragDirection.LEFT:
            case DragDirection.RIGHT:
                moveX = Math.max(-maxMove, Math.min(maxMove, deltaX));
                break;
            case DragDirection.UP:
            case DragDirection.DOWN:
                moveY = Math.max(-maxMove, Math.min(maxMove, deltaY));
                break;
        }

        // 移动拖拽的方块
        const dragNode = this.blockNodeMap.get(this.dragBlock);
        if (dragNode) {
            dragNode.setPosition(this.dragOriginalPos.x + moveX, this.dragOriginalPos.y + moveY, 0);
        }

        // 同步移动相邻方块（反向移动）
        if (this.adjacentBlock) {
            const adjacentNode = this.blockNodeMap.get(this.adjacentBlock);
            if (adjacentNode) {
                adjacentNode.setPosition(this.adjacentOriginalPos.x - moveX, this.adjacentOriginalPos.y - moveY, 0);
            }
        }
    }

    /**
     * 获取方块的原始位置
     */
    private getBlockOriginalPosition(block: BlockData): Vec3 {
        return this.positionCache[block.row][block.col];
    }

    /**
     * 触摸结束事件
     */
    private async onTouchEnd(event: EventTouch) {
        if (!this.dragBlock) return;
        if (this.isDragging) {
            if (this.adjacentBlock) {
                await this.trySwapBlocks(this.dragBlock, this.adjacentBlock);
            } else {
                // 复位所有方块到原始位置
                await this.resetAllBlocksToOriginalPosition();
            }
        }
        this.isDragging = false;
        this.dragBlock = null;
        this.adjacentBlock = null;
    }

    /**
     * 尝试交换方块
     */
    private async trySwapBlocks(a: BlockData, b: BlockData) {
        this.isProcessing = true;

        // 先复位所有方块到原始位置
        await this.resetAllBlocksToOriginalPosition();

        // 交换数据
        this.gameLogic.swapBlocks(a, b);

        const matches = this.gameLogic.findMatches();
        if (matches.length > 0) {
            // 有匹配时，更新精灵并处理消除
            this.updateBlockSprites([a, b]);
            await this.handleElimination(matches);
        } else {
            // 没有匹配，交换数据回来
            this.gameLogic.swapBlocks(a, b);
            // 不需要更新精灵，因为数据已经交换回来了
        }

        this.isProcessing = false;
    }

    /**
     * 更新方块精灵
     */
    private updateBlockSprites(blocks: BlockData[]) {
        for (const block of blocks) {
            const node = this.blockNodeMap.get(block);
            if (node) {
                const sprite = node.getComponent(Sprite);
                if (sprite) sprite.spriteFrame = this.blockSprites[block.type];
            }
        }
    }

    /**
     * 复位所有方块到原始位置
     */
    private async resetAllBlocksToOriginalPosition(): Promise<void> {
        return new Promise(resolve => {
            let finished = 0;
            let totalBlocks = 0;

            // 计算需要复位的方块数量
            for (let row = 0; row < this.GRID_ROWS; row++) {
                for (let col = 0; col < this.GRID_COLS; col++) {
                    const block = this.boardModel.getBlock(row, col);
                    if (block) totalBlocks++;
                }
            }

            if (totalBlocks === 0) {
                resolve();
                return;
            }

            // 复位所有方块
            for (let row = 0; row < this.GRID_ROWS; row++) {
                for (let col = 0; col < this.GRID_COLS; col++) {
                    const block = this.boardModel.getBlock(row, col);
                    if (block) {
                        const node = this.blockNodeMap.get(block);
                        if (node) {
                            // 使用缓存的位置
                            const originalPos = this.positionCache[row][col];
                            tween(node)
                                .to(0.1, { position: originalPos })
                                .call(() => {
                                    finished++;
                                    if (finished === totalBlocks) resolve();
                                })
                                .start();
                        }
                    }
                }
            }
        });
    }

    /**
     * 处理消除流程
     */
    private async handleElimination(matches: BlockData[][]) {
        const blocksToRemove = new Set<BlockData>();
        for (const match of matches) for (const block of match) blocksToRemove.add(block);

        // 消除动画
        await this.animateRemoveBlocks(Array.from(blocksToRemove));

        // 更新数据
        this.gameLogic.eliminateMatches(matches);

        // 下落动画 - 只移动现有方块，不重新渲染
        await this.animateDropBlocks();

        // 填充新方块
        this.gameLogic.fillNewBlocks();
        await this.animateFillNewBlocks();

        // 检查连锁消除
        if (this.gameLogic.hasMatches()) {
            await this.handleElimination(this.gameLogic.findMatches());
        }
    }

    /**
     * 消除方块动画
     */
    private async animateRemoveBlocks(blocks: BlockData[]): Promise<void> {
        return new Promise(resolve => {
            let finished = 0;
            for (const block of blocks) {
                const node = this.blockNodeMap.get(block);
                if (node) {
                    // 从映射中移除引用，然后销毁节点
                    this.blockNodeMap.delete(block);
                    node.destroy();
                    finished++;
                    if (finished === blocks.length) resolve();
                }
            }
            if (blocks.length === 0) resolve();
        });
    }

    /**
     * 方块下落动画
     */
    private async animateDropBlocks(): Promise<void> {
        const dropPromises: Promise<void>[] = [];

        for (let col = 0; col < this.GRID_COLS; col++) {
            let emptyRow = this.GRID_ROWS - 1;
            for (let row = this.GRID_ROWS - 1; row >= 0; row--) {
                const block = this.boardModel.getBlock(row, col);
                if (block) {
                    if (emptyRow !== row) {
                        // 更新数据
                        this.boardModel.setBlock(emptyRow, col, block);
                        this.boardModel.setBlock(row, col, null);

                        // 执行下落动画
                        const node = this.blockNodeMap.get(block);
                        if (node) {
                            // 使用缓存的位置
                            const targetPosition = this.positionCache[emptyRow][col];
                            const promise = new Promise<void>(resolve => {
                                tween(node)
                                    .to(0.3, { position: targetPosition })
                                    .call(() => {
                                        // 更新blockNodeMap中的引用
                                        this.blockNodeMap.delete(block);
                                        this.blockNodeMap.set(block, node);
                                        resolve();
                                    })
                                    .start();
                            });
                            dropPromises.push(promise);
                        }
                    }
                    emptyRow--;
                }
            }
        }

        await Promise.all(dropPromises);
    }

    /**
     * 填充新方块动画
     */
    private async animateFillNewBlocks(): Promise<void> {
        const fillPromises: Promise<void>[] = [];

        for (let col = 0; col < this.GRID_COLS; col++) {
            for (let row = 0; row < this.GRID_ROWS; row++) {
                const block = this.boardModel.getBlock(row, col);
                if (block) {
                    // 检查这个方块是否是新生成的（没有对应的节点）
                    if (!this.blockNodeMap.has(block)) {
                        const node = this.createBlockNode(block);
                        this.blockNodeMap.set(block, node);

                        // 设置初始位置（从顶部开始）
                        const startX = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + col * this.BLOCK_SIZE;
                        const startY = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 + this.BLOCK_SIZE * 2;

                        // 使用缓存的目标位置
                        const targetPosition = this.positionCache[row][col];

                        node.setPosition(startX, startY, 0);

                        const promise = new Promise<void>(resolve => {
                            tween(node)
                                .to(0.3, {
                                    position: targetPosition
                                })
                                .call(() => resolve())
                                .start();
                        });
                        fillPromises.push(promise);
                    }
                }
            }
        }

        await Promise.all(fillPromises);
    }

    /**
     * 组件销毁时清理事件监听
     */
    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}


