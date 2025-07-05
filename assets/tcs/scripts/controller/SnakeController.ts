import { _decorator, Component, instantiate, Node, Vec2, Vec3 } from 'cc';
import { JoystickController } from './JoystickController';
import { SnakeBody } from '../model/SnakeBody';
const { ccclass, property } = _decorator;

/**
 * 单个蛇的控制器
 */
@ccclass('SnakeController')
export class SnakeController extends Component {

    @property(JoystickController)
    private joystickController: JoystickController = null!;

    @property(Node)
    private head: Node = null!;

    @property(Node)
    private body: Node = null!;

    @property(Node)
    private bodyContainer: Node = null!;

    // 蛇的初始参数
    private readonly START_POSITION: Vec2 = new Vec2(0, 0);

    private isMoving: boolean = false;

    private _bodyList: SnakeBody[] = null!;

    private _space: number = 30;

    // 蛇的位置和方向
    private _moveSpeed: number = 100; // 移动速度（像素/秒）
    private _position: Vec3 = new Vec3(0, 0);
    private _currentDirection: Vec3 = new Vec3(0, 0); // 当前实际移动方向
    private _targetDirection: Vec2 = new Vec2(0, 0); // 目标方向（摇杆输入）

    start(): void {
        // 初始化蛇模型
        this.initSnake();

        // 设置摇杆方向变化回调
        this.setupJoystickCallback();
    }

    private initSnake(): void {
        this._bodyList = [];

        // 初始化蛇头
        const snakeHead = this.head.getComponent(SnakeBody) || this.head.addComponent(SnakeBody);
        snakeHead.init(true);
        // 设置蛇头初始位置
        this.head.setPosition(this.START_POSITION.x, this.START_POSITION.y, 0);
        this._bodyList.push(snakeHead);

        // 初始化蛇身，每个身体部分间隔30像素
        for (let i = 1; i <= 8; i++) {
            const node = instantiate(this.body);
            node.setParent(this.bodyContainer);
            node.active = true;

            const snakeBody = node.getComponent(SnakeBody) || node.addComponent(SnakeBody);
            snakeBody.init(false);

            if (i == 1) {
                snakeBody.prior = snakeHead;
            } else {
                snakeBody.prior = this._bodyList[i - 1];
            }

            // 计算身体部分的初始位置：头部位置减去间距
            const bodyPosition = new Vec2(
                this.START_POSITION.x - i * this._space,
                this.START_POSITION.y
            );
            node.setPosition(bodyPosition.x, bodyPosition.y, 0);

            this._bodyList.push(snakeBody);
        }
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
            if (!this.isMoving) {
                this.startMoving();
            }
            this.updateDirection(direction);
        } else {
            // 如果摇杆回到中心，停止移动
            this.stopMoving();
        }
    }

    updateDirection(direction: Vec2): void {
        this._currentDirection = new Vec3(direction.x, direction.y, 0);
        // 设置头部旋转（根据移动方向）
        if (!direction.equals(Vec2.ZERO)) {
            this._bodyList[0].prevEuler = this.head.angle;
            const angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
            this.head.setRotationFromEuler(0, 0, angle);
        }
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
        if (!this.isMoving) {
            return;
        }
        // 更新蛇的移动
        this.updateMovement(deltaTime);
    }

    updateMovement(deltaTime: number): void {
        // 更新蛇的移动
        this._bodyList[0].prevPosition = this.head.getPosition();

        const moveDistance = this._moveSpeed * deltaTime;
        const moveVector = new Vec3();
        Vec3.multiplyScalar(moveVector, this._currentDirection, moveDistance);
        Vec3.add(this._position, this._position, moveVector);

        // 更新头部节点位置
        this.head.setPosition(this._position);

        this.updateBody();
    }

    updateBody() {
        for (let i = 1; i < this._bodyList.length; i++) {
            const body = this._bodyList[i];
            body.prevPosition = body.node.getPosition();
            body.prevEuler = body.node.angle;

            body.node.setPosition(body.prior.prevPosition);
            body.node.setRotationFromEuler(0, 0, body.prior.prevEuler);
        }
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