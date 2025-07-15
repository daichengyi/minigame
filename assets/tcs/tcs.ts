import { _decorator, Component, Node, input, Input, KeyCode } from 'cc';
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
    private enableAddSpeed: boolean = false;

    start() {
        // 初始化蛇控制器
        this.initSnakeController();

        // 初始化相机控制器
        this.initCameraController();

        // 初始化食物控制器
        this.initFoodController();

        // 注册键盘事件
        this.registerKeyboardEvents();

        // 输出键盘控制提示
        console.log('键盘控制：按1键切换加速，按2键随机减少身体');
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

    /**
     * 注册键盘事件监听
     */
    private registerKeyboardEvents(): void {
        // 注册键盘按下事件
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    /**
     * 键盘按下事件处理
     * @param event 键盘事件
     */
    private onKeyDown(event: any): void {
        switch (event.keyCode) {
            case KeyCode.DIGIT_1:
            case KeyCode.NUM_1:
                // 按下1键，触发加速
                this.clickAddSpeed();
                break;
            case KeyCode.DIGIT_2:
            case KeyCode.NUM_2:
                // 按下2键，触发随机减少身体
                this.clickRandomReduce();
                break;
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
            // 根据 enableAddSpeed 设置速度倍率
            const speedMultiplier = this.enableAddSpeed ? 5.0 : 1.0;
            this.snakeController.setSpeedMultiplier(speedMultiplier);

            this.snakeController.update(deltaTime);
        }

        // 更新相机跟随
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }
    }

    /**
     * 移除一节身体的回调方法
     */
    private clickRandomReduce(): void {
        if (this.snakeController) {
            const removedIndex = this.snakeController.randomBody();

            // 可以根据需要添加额外效果，如声音、粒子等
            if (removedIndex >= 0) {
                console.log(`移除了第 ${removedIndex + 1} 节身体`);
            }
        }
    }

    /**
     * 加速
     */
    private clickAddSpeed(): void {
        this.enableAddSpeed = !this.enableAddSpeed;
        console.log(`蛇的速度已${this.enableAddSpeed ? '加速' : '恢复正常'}`);
    }

    /**
     * 组件销毁时调用
     */
    onDestroy() {
        // 移除键盘事件监听
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }
}