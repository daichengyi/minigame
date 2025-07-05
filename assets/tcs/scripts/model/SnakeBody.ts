import { _decorator, Component, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
/**
 * 蛇身体管理 - 双向链表实现
 */
@ccclass('SnakeBody')
export class SnakeBody extends Component {
    private _isHead: boolean = false;

    get isHead(): boolean {
        return this._isHead;
    }

    set isHead(val: boolean) {
        this._isHead = val;
    }

    /** 上一帧位置*/
    private _prevPosition: Vec3 = new Vec3();
    get prevPosition(): Vec3 {
        return this._prevPosition;
    }
    set prevPosition(val: Vec3) {
        this._prevPosition = val;
    }

    /** 上一帧旋转*/
    private _prevEuler: number = 0;
    get prevEuler(): number {
        return this._prevEuler;
    }
    set prevEuler(val: number) {
        this._prevEuler = val;
    }

    /** 前一个节点*/
    private _prior: SnakeBody = null!;
    get prior(): SnakeBody {
        return this._prior;
    }
    set prior(value: SnakeBody) {
        this._prior = value;
    }

    /** 后一个节点*/
    private _next: SnakeBody = null!;
    get next(): SnakeBody {
        return this._next;
    }
    set next(value: SnakeBody) {
        this._next = value;
    }

    init(isHead: boolean) {
        this._isHead = isHead;
        this._prevPosition = this.node.getPosition();
        this._prevEuler = this.node.angle;
    }
}