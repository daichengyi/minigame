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
    // 速度倍率，默认为1.0（正常速度）
    private _speedMultiplier: number = 1.0;

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

        // 额外处理：更新加速状态
        this.updateAccelerationStates(deltaTime);
    }

    /**
     * 设置速度倍率
     * @param multiplier 速度倍率，1.0为正常速度
     */
    setSpeedMultiplier(multiplier: number): void {
        // 限制倍率在合理范围内
        this._speedMultiplier = Math.max(0.5, Math.min(3.0, multiplier));
    }

    /**
     * 获取当前速度倍率
     * @returns 当前速度倍率
     */
    getSpeedMultiplier(): number {
        return this._speedMultiplier;
    }

    /**
     * 更新蛇的移动
     * 根据当前方向和速度移动蛇头，记录轨迹点，更新身体跟随
     * @param deltaTime 帧间隔时间
     */
    private updateMovement(deltaTime: number): void {
        // 应用速度倍率
        const adjustedSpeed = this.MOVE_SPEED * this._speedMultiplier;
        const moveDistance = adjustedSpeed * deltaTime;

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

            // 如果不在加速状态，正常更新位置
            if (!body.isAccelerating) {
                body.prevPosition = body.node.getPosition();
                body.node.setPosition(targetPosition);
            }

            // 更新旋转角度
            this.updateBodyRotation(i, body);
        }
    }

    /**
     * 更新身体节点的旋转
     * @param index 节点索引
     * @param body 身体组件
     */
    private updateBodyRotation(index: number, body: SnakeBody): void {
        const currentPos = body.node.getPosition();

        if (index < this._bodyList.length - 1) {
            // 非尾节点：使用下一个节点的位置计算方向
            const nextPosition = this.getBodyTargetPositionWithInterpolation(index + 1);
            const angle = Math.atan2(
                currentPos.y - nextPosition.y,
                currentPos.x - nextPosition.x
            ) * 180 / Math.PI;
            body.node.setRotationFromEuler(0, 0, angle);
        } else {
            // 尾节点：使用前一个节点的方向
            const prevPosition = this.getBodyTargetPositionWithInterpolation(index - 1);
            const angle = Math.atan2(
                prevPosition.y - currentPos.y,
                prevPosition.x - currentPos.x
            ) * 180 / Math.PI;
            body.node.setRotationFromEuler(0, 0, angle);
        }
    }

    /**
     * 获取蛇头节点
     * @returns 蛇头节点
     */
    getHead(): Node | null {
        return this.head;
    }

    /**
     * 添加身体节点
     * 在蛇尾添加一个新的身体节点
     * @returns 新创建的身体节点
     */
    addBodySegment(): Node {
        // 创建新的身体节点
        const node = instantiate(this.body);
        node.setParent(this.bodyContainer);
        node.active = true;

        const snakeBody = node.getComponent(SnakeBody) || node.addComponent(SnakeBody);
        snakeBody.init();

        // 如果已有身体节点，则将新节点放在最后一个节点的位置
        if (this._bodyList.length > 0) {
            const lastBody = this._bodyList[this._bodyList.length - 1];
            const lastPosition = lastBody.node.getPosition();
            node.setPosition(lastPosition);
        } else {
            // 如果没有身体节点，则放在蛇头后面
            const headPosition = this.head.getPosition();
            const direction = new Vec3(-this._currentDirection.x, -this._currentDirection.y, 0);
            direction.normalize();

            const bodyPosition = new Vec3();
            Vec3.scaleAndAdd(bodyPosition, headPosition, direction, this.BODY_SPACING);
            node.setPosition(bodyPosition);
        }

        // 添加到身体列表
        this._bodyList.push(snakeBody);

        return node;
    }

    /**
     * 随机移除一节身体并触发后续节点加速
     * @returns 被移除的节点索引，如果没有移除则返回-1
     */
    randomBody(): number {
        // 确保至少有2节身体
        if (this._bodyList.length <= 1) return -1;

        // 随机选择一个身体节点（避免选择第一节，保持与头部的连接）
        const minIndex = 1; // 从第二节开始选择
        const maxIndex = this._bodyList.length - 1;
        const randomIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;

        // 获取要移除的节点
        const removedBody = this._bodyList[randomIndex];
        const removedNode = removedBody.node;

        // 从身体列表中移除
        this._bodyList.splice(randomIndex, 1);

        // 标记后续节点进入加速状态
        this.triggerAccelerationEffect(randomIndex);

        // 销毁节点
        removedNode.destroy();

        // 重新平衡轨迹点系统
        this.rebalanceTrajectorySystem();

        // 返回移除的索引
        return randomIndex;
    }

    /**
     * 触发加速效果
     * @param startIndex 开始加速的节点索引
     */
    private triggerAccelerationEffect(startIndex: number): void {
        // 基础加速因子
        const baseAcceleration = 2.0;

        // 影响范围（节点数）
        const affectRange = 5;

        // 为范围内的后续节点设置加速状态
        for (let i = startIndex; i < Math.min(this._bodyList.length, startIndex + affectRange); i++) {
            const body = this._bodyList[i];

            // 设置加速状态
            body.isAccelerating = true;

            // 根据距离计算加速因子（越远加速越小）
            const distanceFactor = 1 - ((i - startIndex) / affectRange);
            const accelerationFactor = baseAcceleration * (0.5 + distanceFactor * 0.5);

            body.accelerationFactor = accelerationFactor;
        }
    }

    /**
     * 计算加速状态下的位置
     * @param body 身体组件
     * @param targetPosition 目标位置
     * @param deltaTime 时间增量
     * @returns 计算后的位置
     */
    private calculateAcceleratedPosition(body: SnakeBody, targetPosition: Vec3, deltaTime: number): Vec3 {
        // 获取当前位置
        const currentPosition = body.node.getPosition();

        // 计算方向向量
        const direction = new Vec3();
        Vec3.subtract(direction, targetPosition, currentPosition);

        // 计算基础移动距离
        const baseDistance = direction.length();

        // 如果已经非常接近目标，直接返回目标位置
        if (baseDistance < 1) {
            return targetPosition.clone();
        }

        // 标准化方向向量
        direction.normalize();

        // 应用加速因子计算移动距离
        const acceleratedDistance = baseDistance * body.accelerationFactor * deltaTime * 10;

        // 限制单次移动距离，防止过冲
        const clampedDistance = Math.min(acceleratedDistance, baseDistance * 0.8);

        // 计算新位置
        const newPosition = new Vec3();
        Vec3.scaleAndAdd(newPosition, currentPosition, direction, clampedDistance);

        return newPosition;
    }

    /**
     * 更新所有节点的加速状态
     * @param deltaTime 帧间隔时间
     */
    private updateAccelerationStates(deltaTime: number): void {
        // 遍历所有身体节点
        for (let i = 0; i < this._bodyList.length; i++) {
            const body = this._bodyList[i];

            // 如果节点处于加速状态
            if (body.isAccelerating) {
                // 获取目标位置
                const targetPosition = this.getBodyTargetPositionWithInterpolation(i);

                // 计算加速后的位置
                const acceleratedPosition = this.calculateAcceleratedPosition(
                    body,
                    targetPosition,
                    deltaTime
                );

                // 保存前一帧位置
                body.prevPosition = body.node.getPosition();

                // 应用新位置
                body.node.setPosition(acceleratedPosition);

                // 更新加速状态
                body.updateAcceleration(deltaTime);
            }
        }
    }

    /**
     * 在移除节点后重新平衡轨迹点系统
     */
    private rebalanceTrajectorySystem(): void {
        // 重新计算需要的轨迹点数量
        const requiredPoints = this._bodyList.length * 8;

        // 确保轨迹点数量合适
        if (this.pointsArray.length > requiredPoints * 1.5) {
            // 如果轨迹点过多，移除多余的点
            while (this.pointsArray.length > requiredPoints) {
                this.pointsArray.shift();
            }
        }

        // 确保至少有最小数量的轨迹点
        const minRequiredPoints = Math.max(10, this._bodyList.length * 3);
        if (this.pointsArray.length < minRequiredPoints) {
            // 如果轨迹点不足，添加当前位置作为额外点
            const currentHeadPos = this.head.getPosition();
            for (let i = this.pointsArray.length; i < minRequiredPoints; i++) {
                this.pointsArray.push(currentHeadPos.clone());
            }
        }
    }
} 