import { _decorator, Component, Node, EventTouch, Vec2, Vec3 } from 'cc';
import { JoystickModel } from '../model/JoystickModel';
import { JoystickView } from '../view/JoystickView';
const { ccclass, property } = _decorator;

@ccclass('JoystickController')
export class JoystickController extends Component {
    @property(JoystickView)
    private joystickView: JoystickView = null!;

    private joystickModel: JoystickModel = null!;
    private isDragging: boolean = false;
    private centerPosition: Vec2 = new Vec2();

    // 事件回调
    private onDirectionChangeCallback: ((direction: Vec2) => void) | null = null;

    start(): void {
        // 初始化摇杆模型
        this.joystickModel = new JoystickModel();

        // 初始化摇杆视图
        this.joystickView.init(this.joystickModel);

        // 获取摇杆中心位置（UI坐标）
        this.centerPosition = this.getJoystickCenterUIPosition();

        // 注册节点触摸事件
        this.registerNodeTouchEvents();
    }

    // 获取摇杆中心的UI坐标位置
    private getJoystickCenterUIPosition(): Vec2 {
        const joystickBg = this.joystickView.getJoystickBg();
        const worldPos = joystickBg.worldPosition;
        return new Vec2(worldPos.x, worldPos.y);
    }

    // 注册节点触摸事件
    private registerNodeTouchEvents(): void {
        const joystickBg = this.joystickView.getJoystickBg();

        joystickBg.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        joystickBg.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        joystickBg.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        joystickBg.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch): void {
        const touchPos = event.getUILocation();

        this.isDragging = true;
        this.joystickView.setActive(true);

        // 确保摇杆模型被激活
        this.joystickModel.isActive = true;

        this.updateJoystickPosition(touchPos);
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch): void {
        if (!this.isDragging) return;

        const touchPos = event.getUILocation();
        this.updateJoystickPosition(touchPos);
    }

    // 触摸结束事件
    private onTouchEnd(event: EventTouch): void {
        if (this.isDragging) {
            this.isDragging = false;
            this.joystickView.setActive(false);

            // 先触发回调，再重置摇杆状态
            this.triggerDirectionChange();
            this.joystickModel.isActive = false;
        }
    }

    // 更新摇杆位置
    private updateJoystickPosition(touchPos: Vec2): void {
        if (!this.isDragging) return;

        // 更新摇杆方向
        this.joystickModel.updateDirection(touchPos, this.centerPosition);

        // 更新摇杆视图
        this.joystickView.updateJoystickPosition(touchPos, this.centerPosition);

        // 总是触发方向变化回调，让蛇控制器决定如何处理
        this.triggerDirectionChange();
    }

    // 触发方向变化回调
    private triggerDirectionChange(): void {
        if (this.onDirectionChangeCallback) {
            this.onDirectionChangeCallback(this.joystickModel.direction);
        }
    }

    // 设置方向变化回调
    setDirectionChangeCallback(callback: (direction: Vec2) => void): void {
        this.onDirectionChangeCallback = callback;
    }

    // 获取当前摇杆方向
    getCurrentDirection(): Vec2 {
        return this.joystickModel.direction;
    }

    // 获取摇杆是否激活
    isJoystickActive(): boolean {
        return this.joystickModel.isActive;
    }

    // 组件销毁时清理
    onDestroy(): void {
        const joystickBg = this.joystickView.getJoystickBg();

        joystickBg.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        joystickBg.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        joystickBg.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        joystickBg.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
} 