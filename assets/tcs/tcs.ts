import { _decorator, Component, Node } from 'cc';
import { SnakeController } from './scripts/controller/SnakeController';
import { CameraController } from './scripts/controller/CameraController';
const { ccclass, property } = _decorator;

@ccclass('tcs')
export class tcs extends Component {
    @property(Node)
    private snake: Node = null!;

    @property(Node)
    private camera: Node = null!;

    @property(Node)
    private food: Node = null!;

    private snakeController: SnakeController = null!;
    private cameraController: CameraController = null!;

    start() {
        // 初始化蛇控制器
        this.initSnakeController();

        // 初始化相机控制器
        this.initCameraController();
    }

    // 初始化蛇控制器
    private initSnakeController(): void {
        // 获取或添加SnakeController组件
        this.snakeController = this.snake.getComponent(SnakeController) || this.snake.addComponent(SnakeController);
    }

    // 初始化相机控制器
    private initCameraController(): void {
        // 获取或添加CameraController组件
        this.cameraController = this.camera.getComponent(CameraController) || this.camera.addComponent(CameraController);

        // 检查SnakeController的head属性是否存在
        const snakeHead = this.snakeController.getHead();

        // 使用SnakeController的head属性直接引用
        this.cameraController.setTarget(snakeHead);
    }

    update(deltaTime: number) {
        // 更新蛇的移动
        if (this.snakeController) {
            this.snakeController.update(deltaTime);
        }

        // 更新相机跟随
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }
    }
}