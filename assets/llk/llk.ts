import { _decorator, Component, Node } from 'cc';
import { GameController } from './controllers/GameController';
import { GameView } from './views/GameView';

const { ccclass, property } = _decorator;

/**
 * 连连看游戏主组件
 * 使用MVC架构模式
 */
@ccclass('llk')
export class llk extends Component {
    @property(Node) private content: Node = null!;
    @property(Node) private block: Node = null!;

    private gameController: GameController = null!;
    private gameView: GameView = null!;

    start() {
        this.initGame();
    }

    private async initGame() {
        // 创建游戏视图
        this.gameView = this.getComponent(GameView) || this.addComponent(GameView);

        // 设置视图属性
        this.gameView['content'] = this.content;
        this.gameView['block'] = this.block;

        // 创建游戏控制器
        this.gameController = this.getComponent(GameController) || this.addComponent(GameController);

        // 初始化游戏
        await this.gameController.initGame(this.gameView);
    }

    // 公共方法：重新开始游戏
    public restartGame() {
        if (this.gameController) {
            this.gameController.restartGame();
        }
    }

    // 公共方法：设置游戏参数
    public setGameConfig(rows: number, cols: number, blockWidth: number = 60, blockHeight: number = 60) {
        if (this.gameController) {
            this.gameController.setGameConfig({
                rows: rows,
                cols: cols,
                blockWidth: blockWidth,
                blockHeight: blockHeight
            });
        }
    }

    // 公共方法：显示网格
    public showGrid() {
        if (this.gameController) {
            this.gameController.showGrid();
        }
    }

    // 公共方法：隐藏网格
    public hideGrid() {
        if (this.gameController) {
            this.gameController.hideGrid();
        }
    }

    // 公共方法：获取游戏信息
    public getGameInfo() {
        if (this.gameController) {
            return this.gameController.getGameInfo();
        }
        return null;
    }
}