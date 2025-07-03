import { _decorator, Component, Node, Vec2 } from 'cc';
import { JoystickController } from './scripts/controller/JoystickController';
import { SnakeController } from './scripts/controller/SnakeController';
const { ccclass, property } = _decorator;

@ccclass('tcs')
export class tcs extends Component {
    @property(Node)
    private joystick: Node = null!;

    @property(Node)
    private snake: Node = null!;

    private joystickController: JoystickController = null!;
    private snakeController: SnakeController = null!;

    start() {
        // 初始化摇杆控制器
        this.initJoystickController();

        // 初始化蛇控制器
        this.initSnakeController();
    }

    // 初始化摇杆控制器
    private initJoystickController(): void {
        // 获取或添加JoystickController组件
        this.joystickController = this.joystick.getComponent(JoystickController);
        if (!this.joystickController) {
            this.joystickController = this.joystick.addComponent(JoystickController);
        }
    }

    // 初始化蛇控制器
    private initSnakeController(): void {
        // 获取或添加SnakeController组件
        this.snakeController = this.snake.getComponent(SnakeController);
        if (!this.snakeController) {
            this.snakeController = this.snake.addComponent(SnakeController);
        }
    }

    update(deltaTime: number) {
        // 更新蛇的移动
        if (this.snakeController) {
            this.snakeController.update(deltaTime);

            // 每2秒输出一次调试信息
            if (Math.floor(Date.now() / 1000) % 2 === 0) {
                this.snakeController.debugPathInfo();
                this.snakeController.debugInterpolationInfo();
                this.snakeController.debugNodeCount();
            }
        }
    }
}


