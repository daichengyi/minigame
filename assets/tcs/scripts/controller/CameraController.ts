import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 相机控制器 - 实现相机直接跟随目标移动
 * 蛇头始终在相机正中间，优化性能和内存使用
 */
@ccclass('CameraController')
export class CameraController extends Component {

    @property(Node)
    private targetNode: Node = null!;

    @property
    private followSpeed: number = 0.3; // 跟随速度

    @property
    private moveThreshold: number = 0.1; // 移动检测阈值，小于此值的移动将被忽略

    // 上一次目标位置，用于检测目标是否移动
    private lastTargetPosition: Vec3 = new Vec3();

    // 临时向量对象，用于计算，避免重复创建对象
    private _tempVec3: Vec3 = new Vec3();

    // 是否已初始化
    private isInitialized: boolean = false;

    /**
     * 组件启动时调用
     */
    start(): void {
        if (!this.targetNode) {
            console.warn('CameraController: 目标节点未设置');
            return;
        }

        // 设置初始位置
        this.calculateTargetPosition(this._tempVec3);
        this.lastTargetPosition.set(this._tempVec3);
        this.node.setWorldPosition(this._tempVec3);

        this.isInitialized = true;
    }

    /**
     * 每帧更新
     */
    update(deltaTime: number): void {
        if (!this.isInitialized || !this.targetNode) return;

        this.updateCamera();
    }

    /**
     * 更新相机位置
     * 直接跟随蛇头位置，确保蛇头在相机正中间
     * 只有当蛇头移动超过阈值时才更新相机位置
     */
    private updateCamera(): void {
        if (!this.targetNode) return;

        // 计算目标位置
        this.calculateTargetPosition(this._tempVec3);

        // 计算与上次位置的距离平方，避免开方运算
        const moveDistanceSquared = Vec3.squaredDistance(this._tempVec3, this.lastTargetPosition);

        // 如果移动距离小于阈值，则不更新相机位置
        if (moveDistanceSquared < this.moveThreshold * this.moveThreshold) {
            return;
        }

        // 更新上一次目标位置
        this.lastTargetPosition.set(this._tempVec3);

        // 获取当前相机世界位置
        const currentPosition = this.node.getWorldPosition();

        // 动态调整跟随速度，距离越远跟随越快
        const distance = Math.sqrt(moveDistanceSquared);
        const dynamicSpeed = Math.min(this.followSpeed * (1 + distance * 0.01), 0.9);

        // 使用Lerp插值计算新位置
        Vec3.lerp(this._tempVec3, currentPosition, this._tempVec3, dynamicSpeed);

        // 更新相机位置
        this.node.setWorldPosition(this._tempVec3);
    }

    /**
     * 计算目标位置
     * 直接返回蛇头世界位置，确保蛇头在相机正中间
     * @param out 输出结果到此向量，避免创建新对象
     */
    private calculateTargetPosition(out: Vec3): Vec3 {
        if (!this.targetNode) {
            this.node.getWorldPosition(out);
            return out;
        }

        // 获取蛇头世界位置
        this.targetNode.getWorldPosition(out);
        return out;
    }

    /**
     * 设置跟随目标
     * @param target 目标节点
     */
    setTarget(target: Node): void {
        if (!target) {
            console.error('CameraController: 设置的目标节点为空');
            return;
        }

        this.targetNode = target;

        if (this.isInitialized) {
            // 重置位置缓存
            this.calculateTargetPosition(this.lastTargetPosition);
        }
    }

    /**
     * 设置跟随速度
     * @param speed 跟随速度 (0-1)
     */
    setFollowSpeed(speed: number): void {
        this.followSpeed = Math.max(0, Math.min(1, speed));
    }

    /**
     * 设置移动阈值
     * @param threshold 移动阈值
     */
    setMoveThreshold(threshold: number): void {
        this.moveThreshold = Math.max(0, threshold);
    }

    /**
     * 立即移动到目标位置（无插值）
     */
    snapToTarget(): void {
        if (!this.targetNode) return;

        // 计算目标位置并直接设置
        this.calculateTargetPosition(this._tempVec3);
        this.node.setWorldPosition(this._tempVec3);

        // 更新位置缓存
        this.lastTargetPosition.set(this._tempVec3);
    }
} 