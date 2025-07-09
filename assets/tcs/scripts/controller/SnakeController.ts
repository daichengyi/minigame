import { _decorator, Component, instantiate, Node, Vec2, Vec3 } from 'cc';
import { JoystickController } from './JoystickController';
import { SnakeBody } from '../model/SnakeBody';
const { ccclass, property } = _decorator;

/**
 * 贪吃蛇控制器 - 优化版本
 * 负责管理贪吃蛇的移动、身体跟随、轨迹点记录等核心逻辑
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

    // 游戏参数
    private readonly START_POSITION: Vec2 = new Vec2(0, 0);
    private readonly INIT_LENGTH: number = 10;
    private readonly MOVE_SPEED: number = 100; // 移动速度（像素/秒）
    private readonly POINT_RECORD_DISTANCE: number = 5; // 轨迹点记录间隔，像素
    private readonly BODY_SPACING: number = 30; // 身体间距（像素）

    // 状态管理
    private isMoving: boolean = false;
    private _bodyList: SnakeBody[] = [];
    private _currentDirection: Vec3 = new Vec3(0, 0);

    // 轨迹点系统
    private pointsArray: Vec3[] = [];
    private lastRecordPosition: Vec3 = new Vec3();

    /**
     * 组件启动时调用
     * 初始化贪吃蛇并设置摇杆回调
     */
    start(): void {
        this.initSnake();
        this.setupJoystickCallback();
    }

    /**
     * 初始化贪吃蛇
     * 创建蛇头、蛇身，设置初始位置，初始化轨迹点系统
     */
    private initSnake(): void {
        this._bodyList = [];
        this.pointsArray = [];
        this.lastRecordPosition = new Vec3();

        // 初始化蛇头
        const snakeHead = this.head.getComponent(SnakeBody) || this.head.addComponent(SnakeBody);
        snakeHead.init();
        this.head.setPosition(this.START_POSITION.x, this.START_POSITION.y, 0);

        // 记录初始轨迹点
        this.lastRecordPosition = this.head.getPosition();
        this.pointsArray.push(this.lastRecordPosition.clone());

        // 初始化蛇身
        for (let i = 0; i < this.INIT_LENGTH; i++) {
            const node = instantiate(this.body);
            node.setParent(this.bodyContainer);
            node.active = true;

            const snakeBody = node.getComponent(SnakeBody) || node.addComponent(SnakeBody);
            snakeBody.init();

            // 设置初始位置 - 使用BODY_SPACING常量确保一致性
            const bodyPosition = new Vec3(
                this.START_POSITION.x - i * this.BODY_SPACING,
                this.START_POSITION.y,
                0
            );
            node.setPosition(bodyPosition);
            this._bodyList.push(snakeBody);
        }
    }

    /**
     * 设置摇杆回调
     * 注册摇杆方向变化事件，当摇杆输入时更新蛇的移动
     */
    private setupJoystickCallback(): void {
        this.joystickController.setDirectionChangeCallback((direction: Vec2) => {
            this.onJoystickDirectionChange(direction);
        });
    }

    /**
     * 摇杆方向变化回调
     * 处理摇杆输入，控制蛇的移动状态和方向
     * @param direction 摇杆输入的方向向量
     */
    private onJoystickDirectionChange(direction: Vec2): void {
        if (!direction.equals(Vec2.ZERO)) {
            if (!this.isMoving) {
                this.isMoving = true;
            }
            this.updateDirection(direction);
        } else {
            this.isMoving = false;
        }
    }

    /**
     * 更新蛇的移动方向
     * 根据摇杆输入更新当前移动方向，并设置蛇头的旋转角度
     * @param direction 目标移动方向
     */
    private updateDirection(direction: Vec2): void {
        this._currentDirection = new Vec3(direction.x, direction.y, 0);

        if (!direction.equals(Vec2.ZERO)) {
            const angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
            this.head.setRotationFromEuler(0, 0, angle);
        }
    }

    /**
     * 每帧更新
     * 如果蛇正在移动，则更新蛇的移动逻辑
     * @param deltaTime 帧间隔时间
     */
    update(deltaTime: number): void {
        if (!this.isMoving) return;
        this.updateMovement(deltaTime);
    }

    /**
     * 更新蛇的移动
     * 根据当前方向和速度移动蛇头，记录轨迹点，更新身体跟随
     * @param deltaTime 帧间隔时间
     */
    private updateMovement(deltaTime: number): void {
        const moveDistance = this.MOVE_SPEED * deltaTime;
        const moveVector = new Vec3();
        Vec3.multiplyScalar(moveVector, this._currentDirection, moveDistance);

        const currentPosition = this.head.getPosition();
        Vec3.add(currentPosition, currentPosition, moveVector);
        this.head.setPosition(currentPosition);

        this.recordTrajectoryPoint();
        this.updateBody();
    }

    /**
     * 记录轨迹点
     * 当蛇头移动距离达到记录间隔时，在轨迹点数组中添加新的位置点
     */
    private recordTrajectoryPoint(): void {
        const currentPosition = this.head.getPosition();
        const distance = Vec3.distance(currentPosition, this.lastRecordPosition);

        if (distance >= this.POINT_RECORD_DISTANCE) {
            this.pointsArray.push(currentPosition.clone());
            this.lastRecordPosition = currentPosition.clone();
            this.cleanTrajectoryPoints();
        }
    }

    /**
     * 清理轨迹点
     * 移除过期的轨迹点，控制内存使用，只保留身体跟随所需的轨迹点数量
     */
    private cleanTrajectoryPoints(): void {
        const maxPoints = this._bodyList.length * 8; // 保留更多轨迹点
        while (this.pointsArray.length > maxPoints) {
            this.pointsArray.shift();
        }
    }

    /**
     * 插值计算身体目标位置
     * 根据身体索引计算其在轨迹点数组中的目标位置，使用线性插值实现平滑移动
     * @param bodyIndex 身体节点的索引
     * @returns 计算出的目标位置
     */
    private getBodyTargetPositionWithInterpolation(bodyIndex: number): Vec3 {
        // 使用BODY_SPACING计算精确的轨迹点索引
        const trajectoryPointIndex = bodyIndex * (this.BODY_SPACING / this.POINT_RECORD_DISTANCE);
        const baseIndex = this.pointsArray.length - 1 - Math.floor(trajectoryPointIndex);

        if (baseIndex < 0) {
            return this.pointsArray[0] || new Vec3();
        }

        if (baseIndex >= this.pointsArray.length - 1) {
            return this.pointsArray[this.pointsArray.length - 1];
        }

        // 计算插值权重
        const fraction = trajectoryPointIndex - Math.floor(trajectoryPointIndex);

        const currentPoint = this.pointsArray[baseIndex];
        const nextPoint = this.pointsArray[baseIndex + 1];

        // 线性插值计算
        const interpolatedPosition = new Vec3();
        Vec3.lerp(interpolatedPosition, currentPoint, nextPoint, fraction);

        return interpolatedPosition;
    }

    /**
     * 更新身体节点
     * 遍历所有身体节点，更新它们的位置和旋转角度，实现身体跟随蛇头的效果
     */
    private updateBody(): void {
        for (let i = 0; i < this._bodyList.length; i++) {
            const body = this._bodyList[i];
            const targetPosition = this.getBodyTargetPositionWithInterpolation(i); // 使用插值版本

            body.prevPosition = body.node.getPosition();
            body.node.setPosition(targetPosition);

            // 修复：计算旋转角度
            if (i < this._bodyList.length - 1) {
                // 修复：使用i+1获取下一个位置
                const nextPosition = this.getBodyTargetPositionWithInterpolation(i + 1);
                const angle = Math.atan2(
                    targetPosition.y - nextPosition.y,
                    targetPosition.x - nextPosition.x
                ) * 180 / Math.PI;
                body.node.setRotationFromEuler(0, 0, angle);
            } else {
                // 最后一个节点：使用前一个节点的方向
                const prevPosition = this.getBodyTargetPositionWithInterpolation(i - 1);
                const angle = Math.atan2(
                    prevPosition.y - targetPosition.y,
                    prevPosition.x - targetPosition.x
                ) * 180 / Math.PI;
                body.node.setRotationFromEuler(0, 0, angle);
            }
        }
    }

    /**
     * 获取蛇头节点
     * @returns 蛇头节点
     */
    getHead(): Node | null {
        return this.head;
    }
} 