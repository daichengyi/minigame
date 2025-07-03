import { _decorator, Component, Node, Vec2, input, Input, KeyCode } from 'cc';
import { SnakeController } from './controller/SnakeController';
const { ccclass, property } = _decorator;

@ccclass('TestSnake')
export class TestSnake extends Component {
    @property(SnakeController)
    private snakeController: SnakeController = null!;

    start() {
        // 注册键盘事件用于测试
        this.registerKeyboardEvents();
    }

    // 注册键盘事件
    private registerKeyboardEvents(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    // 键盘按下事件
    private onKeyDown(event: any): void {
        switch (event.keyCode) {
            case KeyCode.SPACE:
                // 空格键：添加身体节点
                this.snakeController.addBodyPart();
                console.log('添加身体节点，当前数量:', this.snakeController.getBodyPartCount());
                break;

            case KeyCode.BACKSPACE:
                // 退格键：移除身体节点
                this.snakeController.removeBodyPart();
                console.log('移除身体节点，当前数量:', this.snakeController.getBodyPartCount());
                break;

            case KeyCode.KEY_S:
                // S键：开始移动
                this.snakeController.startMoving();
                console.log('开始移动');
                break;

            case KeyCode.KEY_X:
                // X键：停止移动
                this.snakeController.stopMoving();
                console.log('停止移动');
                break;

            case KeyCode.DIGIT_1:
                // 数字1：设置慢速
                this.snakeController.setMoveSpeed(100);
                console.log('设置慢速: 100');
                break;

            case KeyCode.DIGIT_2:
                // 数字2：设置中速
                this.snakeController.setMoveSpeed(200);
                console.log('设置中速: 200');
                break;

            case KeyCode.DIGIT_3:
                // 数字3：设置快速
                this.snakeController.setMoveSpeed(300);
                console.log('设置快速: 300');
                break;

            case KeyCode.KEY_R:
                // R键：重置蛇
                this.snakeController.resetSnake();
                console.log('重置蛇');
                break;
        }
    }

    update(deltaTime: number) {
        // 实时输出蛇的状态
        if (this.snakeController) {
            const position = this.snakeController.getSnakePosition();
            const direction = this.snakeController.getSnakeDirection();
            const isMoving = this.snakeController.isSnakeMoving();
            const bodyCount = this.snakeController.getBodyPartCount();

            // 每秒输出一次状态（避免日志过多）
            if (Math.floor(Date.now() / 1000) % 60 === 0) {
                console.log('蛇状态 - 位置:', position, '方向:', direction, '移动:', isMoving, '身体数量:', bodyCount);
            }
        }
    }

    // 组件销毁时清理
    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }
} 