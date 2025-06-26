import { _decorator, Component, Node, Sprite, UITransform, instantiate, Vec3, input, Input, EventTouch, Vec2, tween, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;
import { BoardModel } from './model/BoardModel';
import { BlockData } from './model/BlockData';
import { BlockType } from './model/BlockType';
import { GameLogic } from './service/GameLogic';

@ccclass('xxl')
export class xxl extends Component {
    @property(Node) private content: Node = null!;
    @property(Sprite) private block: Sprite = null!;

    private readonly GRID_ROWS = 8;
    private readonly GRID_COLS = 8;
    private readonly BLOCK_SIZE = 85;
    private readonly BLOCK_TYPES = 5;

    private boardModel: BoardModel;
    private gameLogic: GameLogic;
    private blockSprites: SpriteFrame[] = [];
    private blockNodeMap: Map<BlockData, Node> = new Map();
    private dragBlock: BlockData | null = null;
    private dragStartPos: Vec2 = new Vec2();
    private dragOriginalPos: Vec3 = new Vec3();
    private isDragging: boolean = false;
    private isProcessing: boolean = false;
    private dragDirection: string = '';

    start() {
        this.loadBlockSprites();
    }

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

    private initGame() {
        this.boardModel = new BoardModel(this.GRID_ROWS, this.GRID_COLS, this.BLOCK_TYPES);
        this.gameLogic = new GameLogic(this.boardModel);
        this.generateInitialBlocks();
        this.renderBoard();
    }

    private generateInitialBlocks() {
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                let type: BlockType;
                do {
                    type = Math.floor(Math.random() * this.BLOCK_TYPES);
                } while (this.wouldCreateMatch(row, col, type));
                this.boardModel.setBlock(row, col, new BlockData(type, row, col));
            }
        }
    }

    private wouldCreateMatch(row: number, col: number, type: BlockType): boolean {
        // 只检查左侧和上方
        let count = 1;
        for (let i = 1; i <= 2; i++) {
            if (col - i >= 0 && this.boardModel.getBlock(row, col - i)?.type === type) count++;
            else break;
        }
        if (count >= 3) return true;
        count = 1;
        for (let i = 1; i <= 2; i++) {
            if (row - i >= 0 && this.boardModel.getBlock(row - i, col)?.type === type) count++;
            else break;
        }
        return count >= 3;
    }

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

    private createBlockNode(block: BlockData): Node {
        const node = instantiate(this.block.node);
        node.setParent(this.content);
        node.active = true;
        node.layer = this.content.layer;
        const transform = node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.BLOCK_SIZE, this.BLOCK_SIZE);
        }
        const x = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + block.col * this.BLOCK_SIZE;
        const y = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 - block.row * this.BLOCK_SIZE;
        node.setPosition(x, y, 0);
        const sprite = node.getComponent(Sprite);
        if (sprite) sprite.spriteFrame = this.blockSprites[block.type];
        return node;
    }

    private setupInput() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

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
            this.dragDirection = '';
            const node = this.blockNodeMap.get(block);
            if (node) this.dragOriginalPos = node.getPosition();
        }
    }

    private hasAdjacentBlock(block: BlockData): boolean {
        // 检查上下左右四个方向是否有相邻方块
        const directions = [
            { row: -1, col: 0 }, // 上
            { row: 1, col: 0 },  // 下
            { row: 0, col: -1 }, // 左
            { row: 0, col: 1 }   // 右
        ];

        for (const dir of directions) {
            const targetRow = block.row + dir.row;
            const targetCol = block.col + dir.col;

            // 检查是否在边界内
            if (targetRow >= 0 && targetRow < this.GRID_ROWS &&
                targetCol >= 0 && targetCol < this.GRID_COLS) {
                const adjacentBlock = this.boardModel.getBlock(targetRow, targetCol);
                if (adjacentBlock) {
                    return true; // 找到相邻方块
                }
            }
        }

        return false; // 没有相邻方块
    }

    private onTouchMove(event: EventTouch) {
        if (!this.dragBlock) return;
        const touchPos = event.getUILocation();
        const deltaX = touchPos.x - this.dragStartPos.x;
        const deltaY = touchPos.y - this.dragStartPos.y;
        const minDragDistance = 20;
        const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (!this.isDragging && totalDistance >= minDragDistance) {
            // 确定拖拽方向
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            let direction = '';

            if (absDeltaX > absDeltaY) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'up' : 'down';
            }

            // 检查该方向是否有相邻方块
            if (this.hasAdjacentBlockInDirection(this.dragBlock, direction)) {
                this.isDragging = true;
                this.dragDirection = direction;
            }
        }

        if (!this.isDragging) return;

        // 限制只能沿一个方向拖拽
        let moveX = 0;
        let moveY = 0;
        const maxMove = this.BLOCK_SIZE;

        switch (this.dragDirection) {
            case 'left':
            case 'right':
                moveX = Math.max(-maxMove, Math.min(maxMove, deltaX));
                break;
            case 'up':
            case 'down':
                moveY = Math.max(-maxMove, Math.min(maxMove, deltaY));
                break;
        }

        // 移动拖拽的方块
        const dragNode = this.blockNodeMap.get(this.dragBlock);
        if (dragNode) {
            dragNode.setPosition(this.dragOriginalPos.x + moveX, this.dragOriginalPos.y + moveY, 0);
        }

        // 同步移动相邻方块（反向移动）
        const adjacentBlock = this.getAdjacentBlockByDirection(this.dragBlock, this.dragDirection);
        if (adjacentBlock) {
            const adjacentNode = this.blockNodeMap.get(adjacentBlock);
            if (adjacentNode) {
                const adjacentOriginalPos = this.getBlockOriginalPosition(adjacentBlock);
                adjacentNode.setPosition(adjacentOriginalPos.x - moveX, adjacentOriginalPos.y - moveY, 0);
            }
        }
    }

    private getBlockOriginalPosition(block: BlockData): Vec3 {
        const x = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + block.col * this.BLOCK_SIZE;
        const y = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 - block.row * this.BLOCK_SIZE;
        return new Vec3(x, y, 0);
    }

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
            return this.boardModel.getBlock(targetRow, targetCol);
        }
        return null;
    }

    private async onTouchEnd(event: EventTouch) {
        if (!this.dragBlock) return;
        if (!this.isDragging) {
            this.isDragging = false;
            this.dragBlock = null;
            return;
        }

        const targetBlock = this.getAdjacentBlockByDirection(this.dragBlock, this.dragDirection);
        if (targetBlock) {
            await this.trySwapBlocks(this.dragBlock, targetBlock);
        } else {
            // 复位所有方块到原始位置
            await this.resetAllBlocksToOriginalPosition();
        }
        this.isDragging = false;
        this.dragBlock = null;
    }

    private resetBlockNode(block: BlockData) {
        // 复位拖拽的方块
        const dragNode = this.blockNodeMap.get(block);
        if (dragNode) {
            const x = -(this.GRID_COLS - 1) * this.BLOCK_SIZE / 2 + block.col * this.BLOCK_SIZE;
            const y = (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2 - block.row * this.BLOCK_SIZE;
            tween(dragNode).to(0.2, { position: new Vec3(x, y, 0) }).start();
        }

        // 复位相邻方块
        const adjacentBlock = this.getAdjacentBlockByDirection(block, this.dragDirection);
        if (adjacentBlock) {
            const adjacentNode = this.blockNodeMap.get(adjacentBlock);
            if (adjacentNode) {
                const adjacentOriginalPos = this.getBlockOriginalPosition(adjacentBlock);
                tween(adjacentNode).to(0.2, { position: adjacentOriginalPos }).start();
            }
        }
    }

    private async trySwapBlocks(a: BlockData, b: BlockData) {
        this.isProcessing = true;

        // 先复位所有方块到原始位置
        await this.resetAllBlocksToOriginalPosition();

        // 交换数据
        this.gameLogic.swapBlocks(a, b);
        this.updateBlockSprites([a, b]);

        const matches = this.gameLogic.findMatches();
        if (matches.length > 0) {
            await this.handleElimination(matches);
        } else {
            // 没有匹配，交换数据回来
            this.gameLogic.swapBlocks(a, b);
            this.updateBlockSprites([a, b]);
        }

        this.isProcessing = false;
    }

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
                            const originalPos = this.getBlockOriginalPosition(block);
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

    private updateBlockSprites(blocks: BlockData[]) {
        for (const block of blocks) {
            const node = this.blockNodeMap.get(block);
            if (node) {
                const sprite = node.getComponent(Sprite);
                if (sprite) sprite.spriteFrame = this.blockSprites[block.type];
            }
        }
    }

    private animateSwap(a: BlockData, b: BlockData): Promise<void> {
        return new Promise(resolve => {
            const nodeA = this.blockNodeMap.get(a);
            const nodeB = this.blockNodeMap.get(b);
            if (!nodeA || !nodeB) return resolve();

            const posA = nodeA.getPosition();
            const posB = nodeB.getPosition();
            let finished = 0;

            tween(nodeA)
                .to(0.2, { position: posB })
                .call(() => {
                    finished++;
                    if (finished === 2) resolve();
                })
                .start();

            tween(nodeB)
                .to(0.2, { position: posA })
                .call(() => {
                    finished++;
                    if (finished === 2) resolve();
                })
                .start();
        });
    }

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

    private animateRemoveBlocks(blocks: BlockData[]): Promise<void> {
        return new Promise(resolve => {
            let finished = 0;
            for (const block of blocks) {
                const node = this.blockNodeMap.get(block);
                if (node) {
                    tween(node)
                        .to(0.2, { scale: new Vec3(0, 0, 0) })
                        .call(() => {
                            finished++;
                            if (finished === blocks.length) resolve();
                        })
                        .start();
                }
            }
            if (blocks.length === 0) resolve();
        });
    }

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
                            const targetY = (this.GRID_ROWS - 1 - emptyRow) * this.BLOCK_SIZE - (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;
                            const promise = new Promise<void>(resolve => {
                                tween(node)
                                    .to(0.3, { position: new Vec3(node.position.x, targetY, 0) })
                                    .call(() => resolve())
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
                        const targetY = (this.GRID_ROWS - 1 - row) * this.BLOCK_SIZE - (this.GRID_ROWS - 1) * this.BLOCK_SIZE / 2;

                        node.setPosition(startX, startY, 0);
                        node.setScale(new Vec3(0, 0, 1));

                        const promise = new Promise<void>(resolve => {
                            tween(node)
                                .to(0.3, {
                                    position: new Vec3(startX, targetY, 0),
                                    scale: new Vec3(1, 1, 1)
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

    private hasAdjacentBlockInDirection(block: BlockData, direction: string): boolean {
        let targetRow = block.row;
        let targetCol = block.col;

        switch (direction) {
            case 'up':
                targetRow = block.row - 1;
                break;
            case 'down':
                targetRow = block.row + 1;
                break;
            case 'left':
                targetCol = block.col - 1;
                break;
            case 'right':
                targetCol = block.col + 1;
                break;
        }

        // 检查是否在边界内
        if (targetRow >= 0 && targetRow < this.GRID_ROWS &&
            targetCol >= 0 && targetCol < this.GRID_COLS) {
            const adjacentBlock = this.boardModel.getBlock(targetRow, targetCol);
            return adjacentBlock !== null;
        }

        return false;
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}


