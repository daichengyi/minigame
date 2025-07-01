import { _decorator, Component, Node, Vec2 } from 'cc';
import { JoystickController } from './scripts/controller/JoystickController';
const { ccclass, property } = _decorator;

@ccclass('tcs')
export class tcs extends Component {
    @property(Node)
    private joystick: Node = null!;

    @property(Node)
    private snake: Node = null!;

    private joystickController: JoystickController = null!;

    start() {
        // 初始化摇杆控制器
        this.initJoystickController();
    }

    // 初始化摇杆控制器
    private initJoystickController(): void {
        // 获取或添加JoystickController组件
        this.joystickController = this.joystick.getComponent(JoystickController);
        if (!this.joystickController) {
            this.joystickController = this.joystick.addComponent(JoystickController);
        }

        // 设置摇杆方向变化回调
        this.joystickController.setDirectionChangeCallback((direction: Vec2) => {
            this.onJoystickDirectionChange(direction);
        });
    }

    // 摇杆方向变化回调
    private onJoystickDirectionChange(direction: Vec2): void {
        console.log('摇杆方向变化:', direction);
        // TODO: 这里将处理蛇的移动方向
    }

    update(deltaTime: number) {
        // TODO: 游戏主循环逻辑
    }
}


