import { _decorator, Vec2 } from 'cc';
import { SnakeBody } from './SnakeBody';
const { ccclass, property } = _decorator;

@ccclass('SnakeModel')
export class SnakeModel {
    // 蛇的状态
    private _isActive: boolean = false;
    private _isMoving: boolean = false;

    // 蛇的位置和方向
    private _position: Vec2 = new Vec2(0, 0);
    private _currentDirection: Vec2 = new Vec2(0, 0); // 当前实际移动方向
    private _targetDirection: Vec2 = new Vec2(0, 0); // 目标方向（摇杆输入）

    // 方向插值系统
    private _interpolationProgress: number = 0; // 插值进度（0-1）
    private _interpolationSpeed: number = 180; // 转向速度（度/秒）
    private _isInterpolating: boolean = false; // 是否正在插值

    // 蛇的移动参数
    private _moveSpeed: number = 100; // 移动速度（像素/秒）
    private _bodySpacing: number = 30; // 身体节点间距
    private _minTurnAngle: number = 15; // 最小转向角度（度）

    // 蛇的身体管理（双向链表）
    private _snakeBody: SnakeBody = new SnakeBody();
    private _maxBodyParts: number = 10; // 最大身体节点数

    // 路径记录系统
    private _pathHistory: Vec2[] = []; // 头部移动路径历史
    private _maxPathLength: number = 100; // 最大路径历史长度
    private _pathSpacing: number = 5; // 路径点间距（像素）
    private _lastPathPointDistance: number = 0; // 距离上次记录路径点的距离

    // 获取蛇是否激活
    get isActive(): boolean {
        return this._isActive;
    }

    // 设置蛇是否激活
    set isActive(value: boolean) {
        this._isActive = value;
    }

    // 获取蛇是否在移动
    get isMoving(): boolean {
        return this._isMoving;
    }

    // 设置蛇是否在移动
    set isMoving(value: boolean) {
        this._isMoving = value;
    }

    // 获取蛇的位置
    get position(): Vec2 {
        return this._position.clone();
    }

    // 设置蛇的位置
    set position(value: Vec2) {
        this._position.set(value);
    }

    // 获取蛇的当前方向
    get direction(): Vec2 {
        return this._currentDirection.clone();
    }

    // 设置蛇的当前方向
    set direction(value: Vec2) {
        this._currentDirection.set(value);
    }

    // 获取目标方向
    get targetDirection(): Vec2 {
        return this._targetDirection.clone();
    }

    // 设置目标方向
    set targetDirection(value: Vec2) {
        this._targetDirection.set(value);
    }

    // 获取移动速度
    get moveSpeed(): number {
        return this._moveSpeed;
    }

    // 设置移动速度
    set moveSpeed(value: number) {
        this._moveSpeed = value;
    }

    // 获取身体间距
    get bodySpacing(): number {
        return this._bodySpacing;
    }

    // 获取最小转向角度
    get minTurnAngle(): number {
        return this._minTurnAngle;
    }

    // 获取身体节点数组（保持接口兼容）
    get bodyParts(): Vec2[] {
        return this._snakeBody.getAllPositions();
    }

    // 获取身体节点数量
    get bodyPartCount(): number {
        return this._snakeBody.getLength();
    }

    // 获取最大身体节点数
    get maxBodyParts(): number {
        return this._maxBodyParts;
    }

    // 初始化蛇
    init(startPosition: Vec2, startDirection: Vec2): void {
        this._position.set(startPosition);

        // 强制设置初始方向为向右，确保Y轴偏移为0
        this._currentDirection.set(1, 0);
        this._targetDirection.set(1, 0);

        this._isActive = true;
        this._isMoving = false;

        // 配置蛇身体
        this._snakeBody.setMaxLength(this._maxBodyParts);
        this._snakeBody.setSpacing(this._bodySpacing);

        // 初始化蛇身体
        this._snakeBody.init(startPosition, 3);

        console.log('蛇模型初始化完成，使用双向链表实现');
        this._snakeBody.debugInfo();
    }

    // 更新蛇的方向
    updateDirection(newDirection: Vec2): void {
        if (!this._isActive || newDirection.equals(Vec2.ZERO)) return;

        // 检查方向变化是否足够大才启动插值
        const angleChange = this.getAngleBetweenDirections(this._currentDirection, newDirection);
        if (angleChange > 5) { // 最小角度变化阈值
            this._targetDirection.set(newDirection);
            this.startInterpolation();
        }
    }

    // 更新蛇的移动
    updateMovement(deltaTime: number): void {
        if (!this._isActive || !this._isMoving) return;

        // 计算方向插值
        this.calculateDirectionInterpolation(deltaTime);

        // 更新位置（使用插值后的方向）
        const moveDistance = this._moveSpeed * deltaTime;
        const moveVector = new Vec2();
        Vec2.multiplyScalar(moveVector, this._currentDirection, moveDistance);
        Vec2.add(this._position, this._position, moveVector);

        // 记录路径点
        this._lastPathPointDistance += moveDistance;
        if (this._lastPathPointDistance >= this._pathSpacing) {
            this.addPathPoint(this._position);
            this._lastPathPointDistance = 0;
        }

        // 更新蛇身体
        this.updateSnakeBody();
    }

    // 更新蛇身体
    private updateSnakeBody(): void {
        // 使用路径历史更新身体位置
        this._snakeBody.updateBodyByPath(this._pathHistory, this._bodySpacing);
    }

    // 添加身体节点
    addBodyPart(): void {
        if (this._snakeBody.getLength() < this._maxBodyParts) {
            // 在尾部添加新的身体节点
            const tailNode = this._snakeBody.getTail();
            if (tailNode) {
                // 新节点位置在尾部节点后方
                const newPos = new Vec2();
                Vec2.multiplyScalar(newPos, this._currentDirection, -this._bodySpacing);
                Vec2.add(newPos, tailNode.getPosition(), newPos);

                this._snakeBody.addBodyNode(newPos);
            }
        }
    }

    // 移除身体节点
    removeBodyPart(): void {
        this._snakeBody.removeTailNode();
    }

    // 重置蛇
    reset(): void {
        this._isActive = false;
        this._isMoving = false;
        this._currentDirection.set(Vec2.ZERO);
        this._targetDirection.set(Vec2.ZERO);
        this._snakeBody.clear();
        this._pathHistory = []; // 清空路径历史
        this._lastPathPointDistance = 0;
    }

    // 路径记录系统方法

    // 添加路径点
    private addPathPoint(position: Vec2): void {
        this._pathHistory.push(position.clone());

        // 限制路径历史长度
        if (this._pathHistory.length > this._maxPathLength) {
            this._pathHistory.shift();
        }
    }

    // 根据距离获取路径点
    private getPathPointAtDistance(distance: number): Vec2 | null {
        if (this._pathHistory.length === 0) {
            return null;
        }

        // 计算目标路径点索引
        const targetIndex = Math.floor(distance / this._pathSpacing);

        if (targetIndex >= this._pathHistory.length) {
            return null;
        }

        return this._pathHistory[targetIndex].clone();
    }

    // 清理路径历史
    private cleanupPathHistory(): void {
        // 移除过期的路径点
        while (this._pathHistory.length > this._maxPathLength) {
            this._pathHistory.shift();
        }
    }

    // 获取路径历史长度
    getPathHistoryLength(): number {
        return this._pathHistory.length;
    }

    // 获取路径历史（用于调试）
    getPathHistory(): Vec2[] {
        return this._pathHistory.map(pos => pos.clone());
    }

    // 调试信息
    debugPathInfo(): void {
        console.log('=== 路径调试信息 ===');
        console.log('路径历史长度:', this._pathHistory.length);
        console.log('最大路径长度:', this._maxPathLength);
        console.log('路径点间距:', this._pathSpacing);
        console.log('距离上次记录路径点的距离:', this._lastPathPointDistance);

        if (this._pathHistory.length > 0) {
            console.log('最新路径点:', this._pathHistory[this._pathHistory.length - 1].x, this._pathHistory[this._pathHistory.length - 1].y);
        }
        console.log('=== 路径调试信息结束 ===');
    }

    // 方向插值系统方法

    // 计算方向插值
    private calculateDirectionInterpolation(deltaTime: number): void {
        if (!this._isInterpolating) return;

        // 更新插值进度
        this.updateInterpolationProgress(deltaTime);

        // 计算插值后的方向
        this._currentDirection = this.interpolateDirection(this._currentDirection, this._targetDirection, this._interpolationProgress);

        // 检查插值是否完成
        if (this.isInterpolationComplete()) {
            this._isInterpolating = false;
            this._interpolationProgress = 0;
        }
    }

    // 计算两个方向间的角度（度）
    private getAngleBetweenDirections(dir1: Vec2, dir2: Vec2): number {
        if (dir1.equals(Vec2.ZERO) || dir2.equals(Vec2.ZERO)) return 0;

        const dot = Vec2.dot(dir1, dir2);
        const cross = dir1.x * dir2.y - dir1.y * dir2.x;
        const angle = Math.atan2(cross, dot) * 180 / Math.PI;
        return Math.abs(angle);
    }

    // 方向插值计算
    private interpolateDirection(current: Vec2, target: Vec2, progress: number): Vec2 {
        if (progress >= 1) return target.clone();

        // 使用球面线性插值（SLERP）
        const angle = this.getAngleBetweenDirections(current, target);
        if (angle < 0.1) return target.clone();

        const sinAngle = Math.sin(angle * Math.PI / 180);
        const sinProgress = Math.sin(progress * angle * Math.PI / 180);
        const sinRemaining = Math.sin((1 - progress) * angle * Math.PI / 180);

        const result = new Vec2();
        Vec2.multiplyScalar(result, current, sinRemaining / sinAngle);
        const targetPart = new Vec2();
        Vec2.multiplyScalar(targetPart, target, sinProgress / sinAngle);
        Vec2.add(result, result, targetPart);

        return result.normalize();
    }

    // 开始插值
    private startInterpolation(): void {
        this._isInterpolating = true;
        this._interpolationProgress = 0;
    }

    // 更新插值进度
    private updateInterpolationProgress(deltaTime: number): void {
        const angleChange = this._interpolationSpeed * deltaTime;
        const currentAngle = this.getAngleBetweenDirections(this._currentDirection, this._targetDirection);

        if (currentAngle > 0) {
            this._interpolationProgress += angleChange / currentAngle;
            this._interpolationProgress = Math.min(this._interpolationProgress, 1);
        }
    }

    // 检查插值是否完成
    private isInterpolationComplete(): boolean {
        return this._interpolationProgress >= 1;
    }

    // 设置插值速度
    setInterpolationSpeed(speed: number): void {
        this._interpolationSpeed = speed;
    }

    // 获取插值速度
    getInterpolationSpeed(): number {
        return this._interpolationSpeed;
    }

    // 获取插值进度
    getInterpolationProgress(): number {
        return this._interpolationProgress;
    }

    // 调试插值信息
    debugInterpolationInfo(): void {
        console.log('=== 插值调试信息 ===');
        console.log('当前方向:', this._currentDirection.x, this._currentDirection.y);
        console.log('目标方向:', this._targetDirection.x, this._targetDirection.y);
        console.log('插值进度:', this._interpolationProgress);
        console.log('插值速度:', this._interpolationSpeed);
        console.log('是否正在插值:', this._isInterpolating);
        console.log('方向角度差:', this.getAngleBetweenDirections(this._currentDirection, this._targetDirection));
        console.log('=== 插值调试信息结束 ===');
    }
} 