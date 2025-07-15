import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 蛇身体管理 - 简化版本
 */
@ccclass('SnakeBody')
export class SnakeBody extends Component {
    /** 上一帧位置*/
    private _prevPosition: Vec3 = new Vec3();
    /** 是否处于加速状态 */
    private _isAccelerating: boolean = false;
    /** 加速因子 */
    private _accelerationFactor: number = 1.0;
    /** 加速度衰减系数 */
    private _accelerationDecay: number = 0.95;

    get prevPosition(): Vec3 {
        return this._prevPosition;
    }

    set prevPosition(val: Vec3) {
        this._prevPosition = val;
    }

    get isAccelerating(): boolean {
        return this._isAccelerating;
    }

    set isAccelerating(value: boolean) {
        this._isAccelerating = value;
        if (value) {
            // 重置加速因子
            this._accelerationFactor = 1.0;
        }
    }

    get accelerationFactor(): number {
        return this._accelerationFactor;
    }

    set accelerationFactor(value: number) {
        this._accelerationFactor = value;
    }

    init() {
        this._prevPosition = this.node.getPosition();
        this._isAccelerating = false;
        this._accelerationFactor = 1.0;
    }

    /**
     * 更新加速状态
     * @param deltaTime 时间增量
     */
    updateAcceleration(deltaTime: number): void {
        if (this._isAccelerating) {
            // 随时间衰减加速因子
            this._accelerationFactor *= Math.pow(this._accelerationDecay, deltaTime * 60);

            // 当加速因子接近1时，取消加速状态
            if (this._accelerationFactor < 1.05) {
                this._isAccelerating = false;
                this._accelerationFactor = 1.0;
            }
        }
    }
}