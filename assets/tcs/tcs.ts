import { _decorator, Component, Node } from 'cc';
import { SnakeController } from './scripts/controller/SnakeController';
import { CameraController } from './scripts/controller/CameraController';
import { FoodController } from './scripts/controller/FoodController';
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
    private foodController: FoodController = null!;

    start() {
        // 初始化蛇控制器
        this.initSnakeController();

        // 初始化相机控制器
        this.initCameraController();

        // 初始化食物控制器
        this.initFoodController();
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

    // 初始化食物控制器
    private initFoodController(): void {
        // 创建食物控制器节点
        const foodControllerNode = new Node('FoodController');
        foodControllerNode.setParent(this.node);

        // 获取或添加FoodController组件
        this.foodController = foodControllerNode.addComponent(FoodController);

        // 隐藏原始食物节点（作为模板使用）
        this.food.active = false;

        // 初始化食物控制器
        const snakeHead = this.snakeController.getHead();
        if (snakeHead) {
            this.foodController.init(this.food, snakeHead, this.onFoodEaten.bind(this));
        }
    }

    // 食物被吃回调
    private onFoodEaten(): void {
        // 增加蛇的身体节点
        if (this.snakeController) {
            this.snakeController.addBodySegment();
        }
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