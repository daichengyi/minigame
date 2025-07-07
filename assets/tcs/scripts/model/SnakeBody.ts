import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 蛇身体管理 - 简化版本
 */
@ccclass('SnakeBody')
export class SnakeBody extends Component {
    /** 上一帧位置*/
    private _prevPosition: Vec3 = new Vec3();

    get prevPosition(): Vec3 {
        return this._prevPosition;
    }

    set prevPosition(val: Vec3) {
        this._prevPosition = val;
    }

    init() {
        this._prevPosition = this.node.getPosition();
    }
}