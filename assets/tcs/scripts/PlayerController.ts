import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, EventMouse, Camera, view } from 'cc';
import { Snake } from './Snake';
const { ccclass, property } = _decorator;

/**
 * This is where we control our player's snake.
 * 
 * 转换说明：
 * - Unity MonoBehaviour -> Cocos Creator Component
 * - GameObject -> Node
 * - Vector3 -> Vec3
 * - Input系统 -> Cocos Creator input系统
 * - Awake -> onLoad, Start -> start, Update -> update, LateUpdate -> lateUpdate
 */

@ccclass('PlayerController')
export class PlayerController extends Snake {
    // ===== 玩家控制相关属性 =====
    // private joystickHelper: Node = null!; // 虚拟摇杆辅助节点

    // 转换说明：Unity的Awake改为Cocos Creator的onLoad
    onLoad() {
        // Init
        this.totalBodyParts = 0;
        // this.setCurrentFoodToBodypartCounter(0);
        this.bodyParts = [];
        this.lastBodypart = null!;
        // 转换说明：Unity的GameObject.FindGameObjectWithTag改为Node的scene.getChildByName
        // this.joystickHelper = this.node.scene.getChildByName("JoystickPositionController")!;
        this.setTargetPosition(new Vec3(0, 0, 0));
        this.setMyDirection(new Vec3(0, 0, 0));

        this.skinID = 1; // PlayerPrefs.GetInt("SelectedSkinID", 0);

    }

    // 转换说明：Unity的Start改为Cocos Creator的start
    start() {
        // Create the snake
        this.createSnake(this.node);

        // Player nickname - it should be received via NETWORK but for now, we use a hardcoded string
        // 注意：自定义脚本保持原样，需要在实际项目中实现
        // nickname = "You";
        // nickname = PlayerPrefs.GetString("PlayerName", "You");

        // Set this snake as the main player snake on GameController - this needs to be synced over netwrok since each newtwork player controls its own snake
        // GameController.instance.SetMainPlayer(this.gameObject);

        // Create a sticky name that follows the snake on the pit
        // NicknameGenerator.instance.CreateStickyNickname(gameObject);
    }

    // 转换说明：Unity的LateUpdate改为Cocos Creator的lateUpdate，并添加deltaTime参数
    lateUpdate(deltaTime: number) {
        if (!true || false) { // GameController.isGameStarted || GameController.isGameFinished
            // stop boost sfx
            // 注意：自定义脚本保持原样，需要在实际项目中实现
            // SfxPlayer.instance.StopLoopedSfx(7);

            // Do nothing
            return;
        }

        // Control type #1 - using virtual joystick - useful for touch devices
        // Control type #2 - using mouse & single click to burst - useful for PC & desktop        
        // this.handleBoostState(0); // GameController.controlType
        this.setTargetPosition(this.get2dMousePosition(0)); // GameController.controlType
        this.setMyDirection(this.getDirectionToMouse());
        this.rotateTowardsInput();
        this.moveTowardsInput();
    }



    /**
     * 减少身体部分
     * 当额外速度模式开启足够长时间时，减少蛇的身体部分！
     */
    public reduceBodyparts(): void {
        this.setBodyReduceCounter(this.getBodyReduceCounter() + 1); // Counter is increased by 1 each frame
        if (this.getBodyReduceCounter() % this.getFramesNeededForBodyReduce() === 0) {
            this.setBodyReduceCounter(0);

            this.removeBodypart();
        }
    }

    /**
     * 获取2D鼠标位置
     * 查找玩家鼠标在屏幕上的位置。我们需要这个数据，因为我们的蛇应该始终朝着我们的输入位置移动
     * @param ctrlType 控制类型
     * @returns 2D鼠标位置
     */
    public get2dMousePosition(ctrlType: number = 0): Vec3 {
        const result = new Vec3();

        //头部移动位置

        return result;
    }

    /**
     * 获取朝向鼠标的方向
     * 查找从蛇到玩家输入位置的方向。这是需要的，这样我们就可以适当地旋转蛇
     * @returns 朝向鼠标的方向向量
     */
    public getDirectionToMouse(): Vec3 {
        const dir = new Vec3();
        // 转换说明：Unity的Vector3运算改为Vec3的静态方法
        Vec3.subtract(dir, this.getTargetPosition(), this.node.position);
        return dir;
    }

    /**
     * 朝向输入方向旋转
     */
    public rotateTowardsInput(): void {
        if (this.getMyDirection().length() > 0.1) {
            // 转换说明：Unity的Mathf.Atan2改为Math.atan2，角度转换
            const angle = Math.atan2(this.getMyDirection().y, this.getMyDirection().x) * 180 / Math.PI;
            // 转换说明：Unity的transform.rotation改为Node的setRotationFromEuler方法
            this.node.setRotationFromEuler(0, 0, angle);
        }
    }

    /**
     * 朝向输入方向移动
     */
    public moveTowardsInput(): void {
        const moveSpeed = this.getMoveSpeed() * this.getMoveSpeedBoost();
        // 转换说明：Unity的Vector3.normalized改为Vec3的normalize方法
        const direction = this.getMyDirection().normalize();
        const movement = new Vec3();
        // 转换说明：Unity的Vector3运算改为Vec3的静态方法
        Vec3.multiplyScalar(movement, direction, moveSpeed * 0.016); // deltaTime
        // 转换说明：Unity的transform.position改为Node的setPosition方法
        this.node.setPosition(
            this.node.position.x + movement.x,
            this.node.position.y + movement.y,
            this.node.position.z
        );
    }

    /**
     * 磁铁触发器进入事件
     * @param other 进入的节点
     */
    public onMagnetTriggerEnter(other: Node): void {
        // 磁铁效果处理
        // 这里可以添加磁铁吸引食物的逻辑
    }

    // 碰撞检测方法（忽略碰撞相关，保持原样）
    // 转换说明：碰撞相关代码已忽略，按照要求保持原样
    // private onTriggerEnter(other: Collider): void {
    //     // 碰撞处理逻辑
    // }

    /**
     * 更新皮肤
     * @param skinID 皮肤ID
     */
    public updateSkin(skinID: number = 0): void {
        this.skinID = skinID;
        // 更新皮肤逻辑
        // 注意：自定义脚本保持原样，需要在实际项目中实现
        // headShape.sprite = SkinManager.instance.GetHeadSkin(skinID);
        // 更新身体部分皮肤
        for (let i = 0; i < this.bodyParts.length; i++) {
            // this.bodyParts[i].getComponent(BodypartController).bodyShape.sprite = SkinManager.instance.GetBodySkin(skinID);
        }
    }

    /**
     * 玩家死亡处理
     */
    public die(): void {
        // 玩家死亡的特殊处理
        super.die();

        // 额外的玩家死亡逻辑
        console.log("Player died with special handling");
    }
} 