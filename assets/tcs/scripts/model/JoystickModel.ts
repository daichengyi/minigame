import { Vec2 } from 'cc';

export class JoystickModel {
    // 摇杆状态
    private _isActive: boolean = false;

    // 摇杆方向
    private _direction: Vec2 = new Vec2(0, 0);

    // 摇杆参数
    private _maxRadius: number = 200; // 最大移动半径
    private _minAngleThreshold: number = 15; // 最小角度阈值（度）

    // 获取摇杆是否激活
    get isActive(): boolean {
        return this._isActive;
    }

    // 设置摇杆激活状态
    set isActive(value: boolean) {
        this._isActive = value;
        if (!value) {
            this._direction.set(Vec2.ZERO);
        }
    }

    // 获取标准化方向向量
    get direction(): Vec2 {
        return this._direction.clone();
    }

    // 获取摇杆角度（度）
    get angle(): number {
        if (this._direction.equals(Vec2.ZERO)) {
            return 0;
        }
        return Math.atan2(this._direction.y, this._direction.x) * 180 / Math.PI;
    }

    // 获取最大半径
    get maxRadius(): number {
        return this._maxRadius;
    }

    // 获取最小角度阈值
    get minAngleThreshold(): number {
        return this._minAngleThreshold;
    }

    // 更新摇杆方向
    updateDirection(touchPos: Vec2, centerPos: Vec2): void {
        if (!this._isActive) {
            this._direction.set(Vec2.ZERO);
            return;
        }

        // 计算相对于中心的方向（使用UI坐标）
        const relativePos = new Vec2();
        Vec2.subtract(relativePos, touchPos, centerPos);

        // 限制在最大半径内
        const distance = relativePos.length();
        if (distance > this._maxRadius) {
            relativePos.multiplyScalar(this._maxRadius / distance);
        }

        // 标准化方向向量
        if (distance > 0) {
            this._direction.set(relativePos.normalize());
        } else {
            this._direction.set(Vec2.ZERO);
        }
    }

    // 检查是否达到最小角度阈值
    isAngleValid(): boolean {
        return Math.abs(this.angle) >= this._minAngleThreshold;
    }

    // 重置摇杆状态
    reset(): void {
        this._isActive = false;
        this._direction.set(Vec2.ZERO);
    }
} 