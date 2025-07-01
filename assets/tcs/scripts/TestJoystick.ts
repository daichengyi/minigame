import { _decorator, Component, Node, Vec2 } from 'cc';
import { JoystickController } from './controller/JoystickController';
const { ccclass, property } = _decorator;

@ccclass('TestJoystick')
export class TestJoystick extends Component {
    @property(JoystickController)
    private joystickController: JoystickController = null!;

    start() {
        // 设置摇杆方向变化回调
        if (this.joystickController) {
            this.joystickController.setDirectionChangeCallback((direction: Vec2) => {
                console.log('摇杆测试 - 方向变化:', direction);
                console.log('摇杆角度:', Math.atan2(direction.y, direction.x) * 180 / Math.PI);
            });
        }
    }

    update(deltaTime: number) {
        // 实时输出摇杆状态
        if (this.joystickController) {
            const direction = this.joystickController.getCurrentDirection();
            const isActive = this.joystickController.isJoystickActive();

            if (isActive && !direction.equals(Vec2.ZERO)) {
                console.log('摇杆状态 - 激活:', isActive, '方向:', direction);
            }
        }
    }
} 