import { _decorator, Component, Node, Vec3, Sprite, instantiate, Prefab, resources, SpriteFrame } from 'cc';
import { BodypartController } from './BodypartController';
const { ccclass, property } = _decorator;

/**
 * This is the main Snake controller base class that both player and bot snakes are inherited from. 
 * You can modify the general behaviour of the snake objects here.
 * But you can also tweak "PlayerController" & "BotController" classes incase you are looking for specific changes.
 * 
 * 转换说明：
 * - Unity MonoBehaviour -> Cocos Creator Component
 * - GameObject -> Node
 * - Vector3 -> Vec3
 * - Transform -> Node的属性访问
 * - internal -> private + getter/setter方法
 */

@ccclass('Snake')
export class Snake extends Component {
    // ===== 移动和旋转相关属性 =====
    private moveSpeed: number = 100; // 移动速度 - GameController.moveSpeedMax - 需要在实际项目中设置
    private moveSpeedBoost: number = 1; // 移动速度加成倍数
    private rotationSpeed: number = 3; // 旋转速度
    private rotationSpeedBoostPenalty: number = 1; // 加速时的旋转速度惩罚系数
    private bodypartsFollowDelay: number = 0; // 身体部分跟随延迟时间
    private bodyReduceCounter: number = 0; // 身体减少计数器
    private framesNeededForBodyReduce: number = 100; // 减少身体部分所需的帧数
    private minimumBodyparts: number = 3; // 最小身体部分数量

    // ===== 方向相关属性 =====
    private targetPosition: Vec3 = new Vec3(); // 目标位置
    private myDirection: Vec3 = new Vec3(); // 当前移动方向

    // ===== 身体部分相关属性 =====
    @property({ type: Sprite, tooltip: "Body Parts" })
    public headShape: Sprite = null!; // 头部精灵渲染器

    @property({ type: Node })
    public headPart: Node = null!; // 头部节点

    @property({ type: Prefab })
    public bodyPart: Prefab = null!; // 身体部分预制体

    @property
    private bodyPartsHolder: Node = null!; // 身体部分容器节点

    @property
    public totalBodyParts: number = 0; // 总身体部分数量

    @property({ type: [Node] })
    public bodyParts: Node[] = []; // 身体部分节点数组

    @property({ type: Node })
    public lastBodypart: Node = null!; // 最后一个身体部分节点

    @property({ tooltip: "Skin Settings" })
    public skinID: number = 0; // 皮肤ID

    /**
     * 获取随机皮肤ID
     * @returns 随机皮肤ID (0-9)
     */
    public getRandomSkinID(): number {
        // 转换说明：Unity的Random.Range改为Math.floor(Math.random())
        // Random.Range(0, SkinManager.totalAvailableSkins)
        return Math.floor(Math.random() * 10); // 假设有10个皮肤，需要根据实际项目调整
    }

    /**
     * 获取身体部分数量
     * @returns 身体部分数量
     */
    public getBodypartsCount(): number {
        return this.bodyParts.length;
    }

    /**
     * 创建蛇的基础结构
     * 注意：这里只创建身体部分并分配给容器。实际蛇对象（头部）由BotSpawner创建
     * 对于玩家蛇，头部在游戏场景开始时就已经存在
     * @param actor 蛇的头部节点
     * @param isBot 是否为机器人蛇
     */
    public createSnake(actor: Node, isBot: boolean = false): void {
        // 转换说明：Unity的new GameObject()改为new Node()
        const bph = new Node();
        bph.name = actor.name + "-BodyPartsHolder";
        this.bodyPartsHolder = bph;

        // Skin settings - head
        // 注意：自定义脚本保持原样，需要在实际项目中实现
        // headShape.sprite = SkinManager.instance.GetHeadSkin(skinID);    

        // If this is a bot, we may want to give them additional bodyparts to make the game more fun when played with bots
        let totalBPs = 5; // GameController.instance.GetInitialBodyparts();
        if (isBot) {
            totalBPs += 0; // GameController.instance.GetRandomInitialBodyparts();
        }

        this.addBodypart(totalBPs);
    }

    /**
     * 添加身体部分
     * @param amount 添加数量
     */
    public addBodypart(amount: number = 1): void {
        // 转换说明：Unity的StartCoroutine改为Cocos Creator的scheduleOnce
        this.scheduleOnce(() => {
            this.addBodypartCo(amount);
        }, 0);
    }

    /**
     * 协程方式添加身体部分
     * @param amount 添加数量
     */
    public addBodypartCo(amount: number = 1): void {
        for (let i = 0; i < amount; i++) {
            this.addBodypartMain();
            // 转换说明：Unity的yield return new WaitForEndOfFrame()在Cocos Creator中使用scheduleOnce替代
            // yield return new WaitForEndOfFrame() - 在Cocos Creator中使用scheduleOnce
        }
    }

    /**
     * 添加单个身体部分的主要逻辑
     */
    public addBodypartMain(): void {
        // Handle exceptions
        if (!this.bodyPartsHolder) {
            return;
        }

        let addPos: Vec3;
        if (this.lastBodypart) {
            addPos = this.lastBodypart.position.clone();
        } else {
            // 转换说明：Unity的transform.position改为Node的position属性
            addPos = this.node.position.clone();
        }

        // 转换说明：Unity的Instantiate改为Cocos Creator的instantiate
        const nbp = instantiate(this.bodyPart);
        this.bodyParts.push(nbp);

        const bodypartController = nbp.getComponent(BodypartController);
        if (bodypartController) {
            bodypartController.partIndex = this.totalBodyParts;
            bodypartController.owner = this.node;

            if (this.lastBodypart) {
                bodypartController.target = this.lastBodypart;
                if (bodypartController) {
                }
            } else {
                bodypartController.target = this.headPart;
            }
        }


        // Skin settings - bodyparts
        // 注意：自定义脚本保持原样，需要在实际项目中实现
        // nbp.getComponent(BodypartController).bodyShape.sprite = SkinManager.instance.GetBodySkin(skinID);
        resources.load('assets/tcs/1/spriteFrame', (err, texture: SpriteFrame) => {
            if (err) {
                console.error('Failed to load bodypart texture:', err);
            } else {
                nbp.getComponent(BodypartController).bodyShape.spriteFrame = texture;
            }
        });
        // 转换说明：Unity的transform.parent改为Node的parent属性
        nbp.name = "Body-" + this.totalBodyParts;
        nbp.parent = this.bodyPartsHolder;
        nbp.setPosition(
            nbp.position.x,
            nbp.position.y,
            (this.totalBodyParts + 1) * 0.0001
        );

        this.totalBodyParts++;

        // Set last bodypart
        this.lastBodypart = nbp;
    }

    /**
     * 移除身体部分（用于加速时保持游戏平衡）
     */
    public removeBodypart(): void {
        // cache last bodypart of this snake
        const bodypartToRemove = this.lastBodypart;

        // remove last BP from array
        this.bodyParts.pop();

        // Update the counter
        this.totalBodyParts--;

        // Assign the new last BP
        this.lastBodypart = this.bodyParts[this.bodyParts.length - 1];

        // Destroy the unused last BP
        // 转换说明：Unity的Destroy改为Node的destroy方法
        bodypartToRemove.destroy();
    }

    /**
     * 蛇死亡处理
     * 所有生命体都会经历这个过程，给垃圾回收器带来很大负担
     */
    public die(): void {
        if (true) { // GameController.canRespawnDeadBots
            // Death of each bot should led to one or more bots being born at the same time
            // 注意：自定义脚本保持原样，需要在实际项目中实现
            // BotSpawner.instance.SpawnBotFromDeadSnake(1);
        }

        // Collider on the head of this object should be disabled instantly
        // 转换说明：碰撞相关代码已忽略，按照要求保持原样
        // GetComponent<SphereCollider>().enabled = false;

        // Important check - see if this is the main player that is dead
        if (this.node.name === "PlayerHead") {
            // Refresh player rank on Leaderboard
            // 注意：自定义脚本保持原样，需要在实际项目中实现
            // IngameLeaderboardManager.instance.GetPlayerRank();

            // Incase speed boost sfx was looped, stop it instantly
            // SfxPlayer.instance.StopLoopedSfx(7);

            // Stats
            // 转换说明：Unity的PlayerPrefs需要在实际项目中重新实现
            // int collectedFood = PlayerPrefs.GetInt("CollectedFood");
            // collectedFood += currentFoodToBodypartCounter;
            // PlayerPrefs.SetInt("CollectedFood", collectedFood);

            console.log("Player is dead & game is over");
            // GameController.instance.Gameover();
        }

        // turn some/all bodyparts of this dead object into eatable foods
        if (true) { // GameController.canTurnDeadSnakesIntoGhostfood
            for (let i = 0; i < this.totalBodyParts; i++) {
                // for 1 out of 2 part, turn it into food
                if (i % 2 === 0) {
                    // FoodSpawner.instance.SpawnGhostFood(bodyParts[i].transform.position);
                }
            }
        }

        // Shake camera if the death was near enough & mainplayer is alive
        // 注意：自定义脚本保持原样，需要在实际项目中实现
        // if (GameController.instance.GetMainPlayer() != null) {
        //     float distanceToPlayer = Vector3.Distance(this.transform.position, GameController.instance.GetMainPlayer().transform.position);
        //     if (distanceToPlayer < GameController.maxDistanceToTriggerShake) {
        //         CameraShaker.instance.PublicShake(1.2f, 0.25f);

        //         //Play death sfx
        //         if (Time.timeSinceLevelLoad > 2f)
        //             SfxPlayer.instance.PlaySfx(4, 1 - (distanceToPlayer / GameController.maxDistanceToTriggerShake));
        //     }
        // }

        // BotSpawner.instance.DeleteBot(this.gameObject);

        if (this.bodyPartsHolder) {
            this.bodyPartsHolder.destroy();
        }
        this.node.destroy();
    }

    // ===== Getter/Setter方法 =====
    // 转换说明：由于将internal改为private，需要提供getter/setter方法来保持接口兼容性
    public getMoveSpeed(): number { return this.moveSpeed; }
    public setMoveSpeed(speed: number): void { this.moveSpeed = speed; }
    public getMoveSpeedBoost(): number { return this.moveSpeedBoost; }
    public setMoveSpeedBoost(boost: number): void { this.moveSpeedBoost = boost; }
    public getRotationSpeed(): number { return this.rotationSpeed; }
    public getRotationSpeedBoostPenalty(): number { return this.rotationSpeedBoostPenalty; }
    public setRotationSpeedBoostPenalty(penalty: number): void { this.rotationSpeedBoostPenalty = penalty; }
    public getBodypartsFollowDelay(): number { return this.bodypartsFollowDelay; }
    public setBodypartsFollowDelay(delay: number): void { this.bodypartsFollowDelay = delay; }
    public getBodyReduceCounter(): number { return this.bodyReduceCounter; }
    public setBodyReduceCounter(counter: number): void { this.bodyReduceCounter = counter; }
    public getFramesNeededForBodyReduce(): number { return this.framesNeededForBodyReduce; }
    public getMinimumBodyparts(): number { return this.minimumBodyparts; }
    public getTargetPosition(): Vec3 { return this.targetPosition; }
    public setTargetPosition(pos: Vec3): void { this.targetPosition = pos; }
    public getMyDirection(): Vec3 { return this.myDirection; }
    public setMyDirection(dir: Vec3): void { this.myDirection = dir; }
    public getBodyPartsHolder(): Node { return this.bodyPartsHolder; }
} 