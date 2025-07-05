import { _decorator, Component, Vec2 } from 'cc';
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

    init() {

    }
}