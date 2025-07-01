import { _decorator, Component, Node, instantiate, Sprite, SpriteFrame, resources, UITransform, Vec3, Color, Graphics } from 'cc';
import { BlockData, GameConfig, PathPoint } from '../models/GameModel';

const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends Component {
    @property(Node) private content: Node = null!;
    @property(Node) private block: Node = null!;

    private spriteFrames: SpriteFrame[] = [];
    private blockNodes: Map<string, Node> = new Map();
    private lineNode: Node = null!;
    private graphics: Graphics = null!;
    private gridNode: Node = null!;
    private gridGraphics: Graphics = null!;

    private config: GameConfig;
    private onBlockClickCallback: ((blockData: BlockData) => void) | null = null;

    // 初始化视图
    public async init(config: GameConfig): Promise<void> {
        this.config = config;
        await this.loadResources();
        this.calculateBlockSize();
        this.initLineNode();
    }

    // 加载资源
    private async loadResources(): Promise<void> {
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

    // 计算方块尺寸
    private calculateBlockSize(): void {
        if (this.block) {
            const transform = this.block.getComponent(UITransform);
            if (transform) {
                this.config.blockWidth = transform.width;
                this.config.blockHeight = transform.height;
            }
        }
    }

    // 初始化连线节点
    private initLineNode(): void {
        this.lineNode = new Node('LineNode');
        this.graphics = this.lineNode.addComponent(Graphics);

        this.lineNode.active = true;
        this.lineNode.layer = this.content.layer;
        this.content.addChild(this.lineNode);

        this.graphics.lineWidth = 6;
        this.graphics.strokeColor = new Color(255, 0, 0, 255);

        console.log('连线节点初始化完成');
    }

    // 初始化网格节点
    private initGridNode(): void {
        console.log('开始初始化网格节点...');

        this.gridNode = new Node('GridNode');
        this.gridGraphics = this.gridNode.addComponent(Graphics);

        this.gridNode.active = true;
        this.gridNode.layer = this.content.layer;
        this.content.addChild(this.gridNode);
        this.gridNode.setSiblingIndex(0);

        console.log('网格节点初始化完成');
    }

    // 创建方块视图
    public createBlocks(blocksData: BlockData[][]): void {
        this.clearBlocks();

        const totalWidth = this.config.cols * this.config.blockWidth + (this.config.cols - 1) * this.config.blockSpacing;
        const totalHeight = this.config.rows * this.config.blockHeight + (this.config.rows - 1) * this.config.blockSpacing;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                const blockData = blocksData[row][col];
                if (blockData) {
                    const blockNode = this.createBlockNode(blockData);

                    const x = startX + col * (this.config.blockWidth + this.config.blockSpacing) + this.config.blockWidth / 2;
                    const y = startY - row * (this.config.blockHeight + this.config.blockSpacing) - this.config.blockHeight / 2;
                    blockNode.setPosition(x, y, 0);

                    this.content.addChild(blockNode);
                    this.blockNodes.set(blockData.nodeId, blockNode);
                }
            }
        }
    }

    // 创建单个方块节点
    private createBlockNode(blockData: BlockData): Node {
        const node = instantiate(this.block);
        node.active = true;

        const transform = node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.config.blockWidth, this.config.blockHeight);
        }

        // 设置图片
        const sprite = node.getComponent(Sprite);
        if (sprite && this.spriteFrames[blockData.type - 1]) {
            sprite.spriteFrame = this.spriteFrames[blockData.type - 1];
        }

        // 添加点击事件
        node.on(Node.EventType.TOUCH_END, () => {
            if (this.onBlockClickCallback) {
                this.onBlockClickCallback(blockData);
            }
        });

        return node;
    }

    // 清空方块
    private clearBlocks(): void {
        this.blockNodes.forEach(node => {
            node.destroy();
        });
        this.blockNodes.clear();
    }

    // 设置方块点击回调
    public setBlockClickCallback(callback: (blockData: BlockData) => void): void {
        this.onBlockClickCallback = callback;
    }

    // 更新方块选中状态
    public updateBlockSelection(blockData: BlockData): void {
        const node = this.blockNodes.get(blockData.nodeId);
        if (node) {
            const sprite = node.getComponent(Sprite);
            if (sprite) {
                sprite.color = blockData.isSelected ?
                    new Color(255, 255, 0, 255) : // 黄色高亮
                    new Color(255, 255, 255, 255); // 白色
            }
        }
    }

    // 消除方块
    public eliminateBlocks(blocks: BlockData[]): void {
        blocks.forEach(block => {
            const node = this.blockNodes.get(block.nodeId);
            if (node) {
                node.destroy();
                this.blockNodes.delete(block.nodeId);
            }
        });
    }

    // 绘制连线
    public drawConnectionLine(path: PathPoint[]): void {
        // console.log('绘制连线路径:', path);

        this.graphics.clear();

        if (path.length < 2) return;

        this.graphics.strokeColor = Color.RED;
        this.graphics.lineWidth = 3;

        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];

            const startPos = this.getWorldPosition(start.row, start.col);
            const endPos = this.getWorldPosition(end.row, end.col);

            // console.log(`绘制线段 ${i}: (${start.row},${start.col}) -> (${end.row},${end.col})`);

            this.graphics.moveTo(startPos.x, startPos.y);
            this.graphics.lineTo(endPos.x, endPos.y);
        }

        this.graphics.stroke();
    }

    // 清除连线
    public clearLine(): void {
        if (this.graphics) {
            this.graphics.clear();
        }
    }

    // 获取世界坐标
    private getWorldPosition(row: number, col: number): Vec3 {
        const totalWidth = this.config.cols * this.config.blockWidth + (this.config.cols - 1) * this.config.blockSpacing;
        const totalHeight = this.config.rows * this.config.blockHeight + (this.config.rows - 1) * this.config.blockSpacing;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        const x = startX + col * (this.config.blockWidth + this.config.blockSpacing) + this.config.blockWidth / 2;
        const y = startY - row * (this.config.blockHeight + this.config.blockSpacing) - this.config.blockHeight / 2;
        return new Vec3(x, y, 0);
    }

    // 绘制网格（可选功能）
    public drawGrid(): void {
        this.initGridNode();

        if (!this.gridGraphics) {
            console.log('gridGraphics不存在');
            return;
        }

        console.log('开始绘制网格...');

        this.gridGraphics.clear();
        this.gridGraphics.strokeColor = new Color(255, 255, 255, 255);
        this.gridGraphics.lineWidth = 4;

        const totalWidth = this.config.cols * this.config.blockWidth + (this.config.cols - 1) * this.config.blockSpacing;
        const totalHeight = this.config.rows * this.config.blockHeight + (this.config.rows - 1) * this.config.blockSpacing;
        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        // 绘制垂直线
        for (let col = 0; col <= this.config.cols; col++) {
            const x = startX + col * (this.config.blockWidth + this.config.blockSpacing);
            const topY = startY + this.config.blockHeight / 2;
            const bottomY = startY - this.config.rows * (this.config.blockHeight + this.config.blockSpacing) + this.config.blockHeight / 2;

            this.gridGraphics.moveTo(x, topY);
            this.gridGraphics.lineTo(x, bottomY);
        }

        // 绘制水平线
        for (let row = 0; row <= this.config.rows; row++) {
            const y = startY - row * (this.config.blockHeight + this.config.blockSpacing);
            const leftX = startX - this.config.blockWidth / 2;
            const rightX = startX + this.config.cols * (this.config.blockWidth + this.config.blockSpacing) - this.config.blockWidth / 2;

            this.gridGraphics.moveTo(leftX, y);
            this.gridGraphics.lineTo(rightX, y);
        }

        this.gridGraphics.stroke();
        console.log('网格绘制完成');
    }

    // 显示游戏胜利
    public showGameWin(): void {
        console.log('游戏胜利！');
        // 这里可以添加胜利UI显示逻辑
    }

    // 重置视图
    public reset(): void {
        this.clearBlocks();
        this.clearLine();
    }
} 