import { _decorator, Component, Node, Vec3, Vec2, tween, Tween, UITransform } from 'cc';
import { JoystickModel } from '../model/JoystickModel';
const { ccclass, property } = _decorator;

@ccclass('JoystickView')
export class JoystickView extends Component {
    @property(Node)
    private joystickBg: Node = null!;

    @property(Node)
    private joystickPoint: Node = null!;

    private joystickModel: JoystickModel = null!;
    private centerPosition: Vec3 = new Vec3();
    private returnTween: Tween<Node> = null!;

    // 回中动画参数
    private readonly RETURN_DURATION: number = 0.2; // 回中动画时长

    // 初始化摇杆视图
    init(joystickModel: JoystickModel): void {
        this.joystickModel = joystickModel;

        // 记录摇杆中心位置
        this.centerPosition.set(this.joystickPoint.position);
    }

    // 更新摇杆点位置
    updateJoystickPosition(touchPos: Vec2, centerPos: Vec2): void {
        if (!this.joystickModel || !this.joystickModel.isActive) return;

        // 计算相对于中心的位置
        const relativePos = new Vec2();
        Vec2.subtract(relativePos, touchPos, centerPos);

        // 限制在最大半径内
        const distance = relativePos.length();
        const maxRadius = this.joystickModel.maxRadius;

        if (distance > maxRadius) {
            relativePos.multiplyScalar(maxRadius / distance);
        }

        // 设置摇杆点位置（相对于joystickBg的本地坐标）
        const joystickBg = this.joystickBg;
        const uiTransform = joystickBg.getComponent(UITransform);

        if (uiTransform) {
            // 将世界坐标转换为joystickBg的本地坐标
            const worldPos = new Vec3(touchPos.x, touchPos.y, 0);
            const localPos = uiTransform.convertToNodeSpaceAR(worldPos);

            // 限制在最大半径内
            const localDistance = localPos.length();
            if (localDistance > maxRadius) {
                localPos.multiplyScalar(maxRadius / localDistance);
            }

            this.joystickPoint.setPosition(localPos.x, localPos.y, 0);
        }
    }

    // 设置摇杆激活状态
    setActive(active: boolean): void {
        if (!this.joystickModel) return;

        this.joystickModel.isActive = active;

        if (!active) {
            // 摇杆松开，开始回中动画
            this.startReturnAnimation();
        } else {
            // 停止回中动画
            this.stopReturnAnimation();
        }
    }

    // 开始回中动画
    private startReturnAnimation(): void {
        // 停止之前的动画
        this.stopReturnAnimation();

        // 创建回中动画
        this.returnTween = tween(this.joystickPoint)
            .to(this.RETURN_DURATION, { position: this.centerPosition }, {
                easing: 'quadOut'
            })
            .call(() => {
                // 动画完成，重置摇杆模型
                this.joystickModel.reset();
                this.returnTween = null!;
            })
            .start();
    }

    // 停止回中动画
    private stopReturnAnimation(): void {
        if (this.returnTween) {
            this.returnTween.stop();
            this.returnTween = null!;
        }
    }

    // 获取摇杆背景节点
    getJoystickBg(): Node {
        return this.joystickBg;
    }

    // 获取摇杆点节点
    getJoystickPoint(): Node {
        return this.joystickPoint;
    }

    // 获取中心位置
    getCenterPosition(): Vec2 {
        return new Vec2(this.centerPosition.x, this.centerPosition.y);
    }

    // 组件销毁时清理
    onDestroy(): void {
        this.stopReturnAnimation();
    }
} 