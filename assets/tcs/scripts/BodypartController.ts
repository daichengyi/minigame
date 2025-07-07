import { _decorator, Component, Node, Vec3, Sprite } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Bodyparts need to follow their targets at all times.
 * The first bodypart will always use the head as its target. Second to last bodyparts will follow the bodypart before them as their target.
 * 
 * 转换说明：
 * - Unity MonoBehaviour -> Cocos Creator Component
 * - GameObject -> Node
 * - Vector3 -> Vec3
 * - Mathf.SmoothDamp -> 自定义实现
 */

@ccclass('BodypartController')
export class BodypartController extends Component {
    // ===== 身体部分属性 =====
    // Starts from 0. Indicates the index number of this part on the holder
    @property
    public partIndex: number = 0; // 身体部分索引（从0开始）

    // The snake object that owns this bodypart
    @property({ type: Node })
    public owner: Node = null!; // 拥有此身体部分的蛇节点

    // This is the target this bodypart needs to follow
    @property({ type: Node })
    public target: Node = null!; // 此身体部分需要跟随的目标节点

    // Reference to body shape
    @property({ type: Sprite })
    public bodyShape: Sprite = null!; // 身体形状精灵渲染器

    // ===== 移动相关变量 =====
    // Movement variables
    private velX: number = 0; // X轴速度
    private velY: number = 0; // Y轴速度
    private rotDump: number = 10; // 旋转阻尼系数

    /**
     * 平滑阻尼算法实现
     * 转换说明：Unity的Mathf.SmoothDamp在Cocos Creator中没有直接对应的方法
     * 这里实现了一个简化版本的平滑阻尼算法
     * 如果需要更精确的效果，可以使用Cocos Creator的Tween系统
     * @param current 当前值
     * @param target 目标值
     * @param velocity 速度引用
     * @param smoothTime 平滑时间
     * @returns 平滑后的值
     */
    private smoothDamp(current: number, target: number, velocity: number, smoothTime: number): number {
        // 简单的平滑阻尼实现
        const deltaTime = 0.016; // 假设60fps
        const omega = 2.0 / smoothTime;
        const x = omega * deltaTime;
        const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
        const change = current - target;
        const originalTo = target;
        target = current - change;
        const temp = (velocity + omega * change) * deltaTime;
        velocity = (velocity - omega * temp) * exp;
        const output = target + (change + temp) * exp;
        if (originalTo - current > 0.0 === output > originalTo) {
            return originalTo;
        }
        return output;
    }

    /**
     * 平滑跟随目标
     * 身体部分平滑地跟随目标节点移动
     */
    public smoothFollow(): void {
        if (!this.target) return;

        // 转换说明：通过字符串获取组件，因为TypeScript类型系统限制
        const snakeComponent = this.owner.getComponent('Snake');
        const followDelay = snakeComponent ? (snakeComponent as any).getBodypartsFollowDelay() : 0.1;

        const newX = this.smoothDamp(this.node.position.x, this.target.position.x, this.velX, followDelay);
        const newY = this.smoothDamp(this.node.position.y, this.target.position.y, this.velY, followDelay);

        // 转换说明：Unity的transform.position改为Node的setPosition方法
        this.node.setPosition(newX, newY, this.node.position.z);

        // 旋转插值
        // 转换说明：Unity的transform.rotation改为Node的eulerAngles属性
        const targetRotation = this.target.eulerAngles;
        const currentRotation = this.node.eulerAngles;
        const lerpRotation = new Vec3(
            currentRotation.x + (targetRotation.x - currentRotation.x) * 0.016 * this.rotDump,
            currentRotation.y + (targetRotation.y - currentRotation.y) * 0.016 * this.rotDump,
            currentRotation.z + (targetRotation.z - currentRotation.z) * 0.016 * this.rotDump
        );
        // 转换说明：Unity的transform.rotation改为Node的setRotationFromEuler方法
        this.node.setRotationFromEuler(lerpRotation.x, lerpRotation.y, lerpRotation.z);
    }

    // 转换说明：Unity的LateUpdate改为Cocos Creator的update方法
    update() {
        // Graceful
        this.smoothFollow();
    }
} 