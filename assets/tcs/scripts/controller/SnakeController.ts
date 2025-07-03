import { _decorator, Component, Node, Vec2 } from 'cc';
import { SnakeModel } from '../model/SnakeModel';
import { SnakeView } from '../view/SnakeView';
import { JoystickController } from './JoystickController';
const { ccclass, property } = _decorator;

@ccclass('SnakeController')
export class SnakeController extends Component {
    @property(SnakeView)
    private snakeView: SnakeView = null!;

    @property(JoystickController)
    private joystickController: JoystickController = null!;

    private snakeModel: SnakeModel = null!;

    // 蛇的初始参数
    private readonly START_POSITION: Vec2 = new Vec2(0, 0);
    private readonly START_DIRECTION: Vec2 = new Vec2(1, 0); // 向右

    start(): void {
        // 初始化蛇模型
        this.snakeModel = new SnakeModel();
        this.snakeModel.init(this.START_POSITION, this.START_DIRECTION);

        // 初始化蛇视图
        this.snakeView.init(this.snakeModel);

        // 设置摇杆方向变化回调
        this.setupJoystickCallback();

        // 输出调试信息
        console.log('蛇初始化完成，身体节点数量:', this.snakeModel.bodyPartCount);
        console.log('初始位置:', this.START_POSITION.x, this.START_POSITION.y);
        console.log('初始方向:', this.START_DIRECTION.x, this.START_DIRECTION.y);

        // 蛇初始时静止，等待用户操作
        // this.startMoving(); // 注释掉自动开始移动
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
            if (!this.snakeModel.isMoving) {
                this.startMoving();
            }
            this.snakeModel.updateDirection(direction);
        } else {
            // 如果摇杆回到中心，停止移动
            this.stopMoving();
        }
    }

    // 开始移动
    startMoving(): void {
        this.snakeModel.isMoving = true;
    }

    // 停止移动
    stopMoving(): void {
        this.snakeModel.isMoving = false;
    }

    // 更新蛇的移动
    update(deltaTime: number): void {
        // 更新蛇的移动
        this.snakeModel.updateMovement(deltaTime);

        // 更新蛇的显示
        this.snakeView.updateSnakeDisplay();
    }

    // 添加身体节点
    addBodyPart(): void {
        this.snakeModel.addBodyPart();
        this.snakeView.addBodyNode();
    }

    // 移除身体节点
    removeBodyPart(): void {
        this.snakeModel.removeBodyPart();
        this.snakeView.removeBodyNode();
    }

    // 设置移动速度
    setMoveSpeed(speed: number): void {
        this.snakeModel.moveSpeed = speed;
    }

    // 获取蛇的位置
    getSnakePosition(): Vec2 {
        return this.snakeModel.position;
    }

    // 获取蛇的方向
    getSnakeDirection(): Vec2 {
        return this.snakeModel.direction;
    }

    // 获取蛇是否在移动
    isSnakeMoving(): boolean {
        return this.snakeModel.isMoving;
    }

    // 获取蛇的身体节点数量
    getBodyPartCount(): number {
        return this.snakeModel.bodyPartCount;
    }

    // 重置蛇
    resetSnake(): void {
        this.snakeModel.reset();
        this.snakeModel.init(this.START_POSITION, this.START_DIRECTION);
    }

    // 设置蛇的可见性
    setSnakeVisible(visible: boolean): void {
        this.snakeView.setVisible(visible);
    }

    // 调试路径信息
    debugPathInfo(): void {
        if (this.snakeModel) {
            this.snakeModel.debugPathInfo();
        }
    }

    // 获取路径历史长度
    getPathHistoryLength(): number {
        return this.snakeModel ? this.snakeModel.getPathHistoryLength() : 0;
    }

    // 调试插值信息
    debugInterpolationInfo(): void {
        if (this.snakeModel) {
            this.snakeModel.debugInterpolationInfo();
        }
    }

    // 设置插值速度
    setInterpolationSpeed(speed: number): void {
        if (this.snakeModel) {
            this.snakeModel.setInterpolationSpeed(speed);
        }
    }

    // 获取插值速度
    getInterpolationSpeed(): number {
        return this.snakeModel ? this.snakeModel.getInterpolationSpeed() : 180;
    }

    // 获取插值进度
    getInterpolationProgress(): number {
        return this.snakeModel ? this.snakeModel.getInterpolationProgress() : 0;
    }

    // 调试节点数量
    debugNodeCount(): void {
        if (this.snakeView) {
            this.snakeView.debugNodeCount();
        }
    }
} 