import { _decorator, Component, Node, Prefab, instantiate, Sprite, SpriteFrame, resources, UITransform, Vec3, Color } from 'cc';
const { ccclass, property } = _decorator;

interface BlockData {
    node: Node;
    type: number;
    row: number;
    col: number;
    isSelected: boolean;
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

    start() {
        this.initGame();
    }

    private async initGame() {
        await this.loadResources();
        this.calculateBlockSize();
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
        // 清空现有内容
        this.content.removeAllChildren();
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
                this.eliminateBlocks();
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
}