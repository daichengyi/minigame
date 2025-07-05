import { _decorator, Component, Node, Vec2 } from 'cc';
import { JoystickController } from './JoystickController';
const { ccclass, property } = _decorator;

/**
 * 单个蛇的控制器
 */
@ccclass('SnakeController')
export class SnakeController extends Component {

    @property(JoystickController)
    private joystickController: JoystickController = null!;

    // 蛇的初始参数
    private readonly START_POSITION: Vec2 = new Vec2(0, 0);

    private isMoving: boolean = false;

    start(): void {
        // 初始化蛇模型

        // 设置摇杆方向变化回调
        this.setupJoystickCallback();
    }

    // 设置摇杆回调
    private setupJoystickCallback(): void {
        this.joystickController.setDirectionChangeCallback((direction: Vec2) => {
            this.onJoystickDirectionChange(direction);
        });
    }

    // 摇杆方向变化回调
    private onJoystickDirectionChange(direction: Vec2): void {
        // 如果摇杆有输入，开始移动并更新方向
        if (!direction.equals(Vec2.ZERO)) {
            // if (!this.snakeModel.isMoving) {
            //     this.startMoving();
            // }
            // this.snakeModel.updateDirection(direction);
        } else {
            // 如果摇杆回到中心，停止移动
            this.stopMoving();
        }
    }

    updateDirection(direction: Vec2): void {
        // 更新头部位置（使用插值后的方向）
        // const moveDistance = this._moveSpeed * deltaTime;
        // const moveVector = new Vec2();
        // Vec2.multiplyScalar(moveVector, this._currentDirection, moveDistance);
        // Vec2.add(this._position, this._position, moveVector);

        // // 更新头部节点位置
        // const headNode = this._snakeBody.getHead();
        // if (headNode) {
        //     headNode.setPosition(this._position);
        // }
    }

    // 开始移动
    startMoving(): void {
        this.isMoving = true;
    }

    // 停止移动
    stopMoving(): void {
        this.isMoving = false;
    }

    // 更新蛇的移动
    update(deltaTime: number): void {
        if (!this.joystickController.isDragging) {
            return;
        }
        // 更新蛇的移动
        this.updateMovement(deltaTime);
    }

    updateMovement(deltaTime: number): void {
        // 更新蛇的移动
    }

    // 添加身体节点
    addBodyPart(): void {
        // this.addBodyPart();
        // this.addBodyNode();
    }

    // 移除身体节点
    removeBodyPart(): void {
        // this.removeBodyPart();
        // this.removeBodyNode();
    }

    // 设置移动速度
    setMoveSpeed(speed: number): void {
        // this.moveSpeed = speed;
    }

} 