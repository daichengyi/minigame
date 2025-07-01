import { _decorator, Component } from 'cc';
import { GameModel, BlockData, GameConfig } from '../models/GameModel';
import { GameView } from '../views/GameView';
import { PathFinder } from '../utils/PathFinder';

const { ccclass } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    private gameModel: GameModel;
    private gameView: GameView;
    private pathFinder: PathFinder;

    // 游戏配置
    private readonly DEFAULT_CONFIG: GameConfig = {
        rows: 12,
        cols: 10,
        blockWidth: 60,
        blockHeight: 60,
        blockSpacing: 2
    };

    // 初始化游戏
    public async initGame(gameView: GameView, config?: Partial<GameConfig>): Promise<void> {
        // 合并配置
        const finalConfig: GameConfig = { ...this.DEFAULT_CONFIG, ...config };

        // 初始化模型
        this.gameModel = new GameModel(finalConfig);

        // 初始化视图
        this.gameView = gameView;
        await this.gameView.init(finalConfig);

        // 初始化路径查找器
        this.pathFinder = new PathFinder(this.gameModel);

        // 设置视图回调
        this.gameView.setBlockClickCallback((blockData: BlockData) => {
            this.onBlockClick(blockData);
        });

        // 开始游戏
        this.startNewGame();
    }

    // 开始新游戏
    public startNewGame(): void {
        console.log('开始新游戏');

        // 重置模型
        this.gameModel.resetGame();

        // 重置视图
        this.gameView.reset();

        // 生成方块类型
        this.gameModel.generateBlockTypes();

        // 创建方块数据
        const blocksData = this.gameModel.createBlocksData();

        // 创建方块视图
        this.gameView.createBlocks(blocksData);

        console.log('新游戏初始化完成');
    }

    // 处理方块点击
    private onBlockClick(blockData: BlockData): void {
        console.log('方块点击:', blockData.row, blockData.col, blockData.type);

        // 如果已经选中，则取消选中
        if (blockData.isSelected) {
            this.deselectBlock(blockData);
            return;
        }

        // 获取当前选中的方块
        const selectedBlocks = this.gameModel.getSelectedBlocks();

        // 如果已经有选中的方块，检查类型是否相同
        if (selectedBlocks.length === 1) {
            const firstBlock = selectedBlocks[0];
            if (firstBlock.type !== blockData.type) {
                console.log('类型不同，清除第一个方块选中状态');
                this.deselectAllBlocks();
                return;
            }
        }

        // 选中方块
        this.selectBlock(blockData);

        // 检查是否可以消除
        const currentSelectedBlocks = this.gameModel.getSelectedBlocks();
        if (currentSelectedBlocks.length === 2) {
            this.checkElimination(currentSelectedBlocks[0], currentSelectedBlocks[1]);
        }
    }

    // 选中方块
    private selectBlock(blockData: BlockData): void {
        this.gameModel.selectBlock(blockData);
        this.gameView.updateBlockSelection(blockData);
    }

    // 取消选中方块
    private deselectBlock(blockData: BlockData): void {
        this.gameModel.deselectBlock(blockData);
        this.gameView.updateBlockSelection(blockData);
    }

    // 检查消除
    private checkElimination(block1: BlockData, block2: BlockData): void {
        // 检查类型是否相同
        if (block1.type !== block2.type) {
            console.log('类型不同，取消选中');
            this.deselectAllBlocks();
            return;
        }

        // 查找连接路径
        const path = this.pathFinder.findPath(block1, block2);

        if (path && path.length > 0) {
            console.log('找到连接路径，开始消除');
            this.eliminateBlocks(path);
        } else {
            console.log('无法找到连接路径，取消选中');
            this.deselectAllBlocks();
        }
    }

    // 消除方块
    private eliminateBlocks(path: any[]): void {
        // 绘制连线
        this.gameView.drawConnectionLine(path);

        // 延迟消除，让玩家看到连线
        this.scheduleOnce(() => {
            const selectedBlocks = this.gameModel.getSelectedBlocks();

            // 消除模型中的方块
            this.gameModel.eliminateBlocks();

            // 消除视图中的方块
            this.gameView.eliminateBlocks(selectedBlocks);

            // 清除连线
            this.gameView.clearLine();

            // 检查游戏是否结束
            this.checkGameEnd();

        }, 0.5);
    }

    // 取消所有选中
    private deselectAllBlocks(): void {
        const selectedBlocks = this.gameModel.getSelectedBlocks();

        // 先将所有选中方块的isSelected设置为false
        selectedBlocks.forEach(block => {
            block.isSelected = false;
        });

        // 更新视图显示
        selectedBlocks.forEach(block => {
            this.gameView.updateBlockSelection(block);
        });

        // 清除模型中的选中状态
        this.gameModel.deselectAllBlocks();
    }

    // 检查游戏结束
    private checkGameEnd(): void {
        if (this.gameModel.isGameEnd()) {
            console.log('游戏胜利！');
            this.gameView.showGameWin();
        }
    }

    // 重新开始游戏
    public restartGame(): void {
        this.startNewGame();
    }

    // 设置游戏配置
    public setGameConfig(config: Partial<GameConfig>): void {
        const finalConfig: GameConfig = { ...this.DEFAULT_CONFIG, ...config };
        this.gameModel = new GameModel(finalConfig);
        this.pathFinder = new PathFinder(this.gameModel);
        this.restartGame();
    }

    // 获取游戏状态信息
    public getGameInfo(): any {
        const blocks = this.gameModel.getBlocks();
        let remainingBlocks = 0;

        for (let row = 0; row < this.gameModel.getConfig().rows; row++) {
            for (let col = 0; col < this.gameModel.getConfig().cols; col++) {
                if (blocks[row][col]) {
                    remainingBlocks++;
                }
            }
        }

        return {
            totalBlocks: this.gameModel.getConfig().rows * this.gameModel.getConfig().cols,
            remainingBlocks: remainingBlocks,
            selectedBlocks: this.gameModel.getSelectedBlocks().length
        };
    }

    // 显示网格（调试用）
    public showGrid(): void {
        this.gameView.drawGrid();
    }

    // 隐藏网格
    public hideGrid(): void {
        // 这里可以添加隐藏网格的逻辑
        console.log('隐藏网格');
    }
} 