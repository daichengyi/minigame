import { _decorator, Component, Node, Vec3, instantiate } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 食物控制器
 * 负责食物的生成、检测和移除
 */
@ccclass('FoodController')
export class FoodController extends Component {
    @property(Node)
    private foodNode: Node = null!;

    @property
    private spawnRadius: number = 500;

    @property
    private eatDistance: number = 100;

    @property
    private minSpawnInterval: number = 3;

    @property
    private maxSpawnInterval: number = 5;

    private snakeHead: Node = null!;
    private foodPool: Node[] = [];

    // 食物被吃回调
    private onFoodEatenCallback: (() => void) | null = null;

    /**
     * 初始化食物控制器
     * @param foodTemplate 食物节点模板
     * @param snakeHead 蛇头节点
     * @param onFoodEaten 食物被吃回调
     */
    init(foodTemplate: Node, snakeHead: Node, onFoodEaten?: () => void): void {
        this.foodNode = foodTemplate;
        this.snakeHead = snakeHead;
        this.onFoodEatenCallback = onFoodEaten || null;

        // 初始化食物池
        this.foodPool = [];

        // 开始生成食物
        this.startFoodSpawnTimer();
    }

    /**
     * 生成食物
     * 在蛇头周围随机位置生成一个食物
     */
    spawnFood(): void {
        // 获取随机位置
        const randomPosition = this.getRandomPosition();

        // 创建食物实例
        const food = instantiate(this.foodNode);
        food.setParent(this.node);
        food.setPosition(randomPosition);
        food.active = true;

        // 添加到食物池
        this.foodPool.push(food);
    }

    /**
     * 获取随机位置
     * 在蛇头周围指定半径内获取随机位置
     */
    private getRandomPosition(): Vec3 {
        // 获取蛇头位置
        const headPosition = this.snakeHead.getPosition();

        // 生成随机角度和距离
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDistance = Math.random() * this.spawnRadius;

        // 计算随机位置
        const x = headPosition.x + Math.cos(randomAngle) * randomDistance;
        const y = headPosition.y + Math.sin(randomAngle) * randomDistance;

        return new Vec3(x, y, 0);
    }

    /**
     * 检测碰撞
     * 检测蛇头与所有食物的距离
     */
    checkCollision(): void {
        if (!this.snakeHead || this.foodPool.length === 0) return;

        const headPosition = this.snakeHead.getWorldPosition();

        // 检查所有食物
        for (let i = this.foodPool.length - 1; i >= 0; i--) {
            const food = this.foodPool[i];
            const foodPosition = food.getWorldPosition();

            // 计算距离
            const distance = Vec3.distance(headPosition, foodPosition);

            // 如果距离小于阈值，触发吃食物事件
            if (distance < this.eatDistance) {
                this.removeFood(food);

                // 调用回调
                if (this.onFoodEatenCallback) {
                    this.onFoodEatenCallback();
                }
            }
        }
    }

    /**
     * 移除食物
     * @param food 要移除的食物节点
     */
    removeFood(food: Node): void {
        // 从食物池中移除
        const index = this.foodPool.indexOf(food);
        if (index !== -1) {
            this.foodPool.splice(index, 1);
        }

        // 销毁节点
        food.destroy();
    }

    /**
     * 启动食物生成定时器
     */
    startFoodSpawnTimer(): void {
        // 先清除已有的定时器
        this.stopFoodSpawnTimer();

        // 立即生成一个食物
        this.spawnFood();

        // 使用 schedule 设置定时器
        this.schedule(this.spawnFoodWithRandomInterval, this.minSpawnInterval);
    }

    /**
     * 带随机间隔的食物生成
     */
    private spawnFoodWithRandomInterval(): void {
        // 生成食物
        this.spawnFood();

        // 取消当前的定时器
        this.unschedule(this.spawnFoodWithRandomInterval);

        // 随机生成间隔时间 (3-5秒)
        const interval = this.minSpawnInterval + Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);

        // 重新设置定时器
        this.schedule(this.spawnFoodWithRandomInterval, interval, 1);
    }

    /**
     * 停止食物生成定时器
     */
    stopFoodSpawnTimer(): void {
        this.unschedule(this.spawnFoodWithRandomInterval);
    }

    /**
     * 组件更新
     * 每帧检测碰撞
     */
    update(): void {
        this.checkCollision();
    }

    /**
     * 组件销毁
     * 清理资源
     */
    onDestroy(): void {
        this.stopFoodSpawnTimer();

        // 清理食物池
        for (const food of this.foodPool) {
            if (food && food.isValid) {
                food.destroy();
            }
        }
        this.foodPool = [];
    }
} 