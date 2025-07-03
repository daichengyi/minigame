import { _decorator, Component, Node, Vec3, Vec2, Sprite, SpriteFrame, resources, Color } from 'cc';
import { SnakeModel } from '../model/SnakeModel';
const { ccclass, property } = _decorator;

@ccclass('SnakeView')
export class SnakeView extends Component {
    @property(Node)
    private head: Node = null!;

    @property(Node)
    private bodyContainer: Node = null!;

    private snakeModel: SnakeModel = null!;
    private bodyNodes: Node[] = [];
    private bodySprites: SpriteFrame[] = [];

    // 初始化蛇的视图
    init(snakeModel: SnakeModel): void {
        console.log('开始初始化蛇视图...');

        this.snakeModel = snakeModel;

        // 先加载皮肤资源，然后创建身体节点
        this.loadBodySprites(() => {
            // 根据SnakeModel的实际身体数量创建显示节点
            this.createDisplayNodesForModel();

            // 立即更新显示，确保身体节点可见
            this.updateSnakeDisplay();

            console.log('蛇视图初始化完成');
        });
    }

    // 加载身体皮肤资源
    private loadBodySprites(callback?: () => void): void {
        console.log('开始加载身体皮肤资源...');

        let loadedCount = 0;
        const totalCount = 8;

        // 加载身体皮肤资源（1-8.png）
        for (let i = 1; i <= 8; i++) {
            resources.load(`tcs/${i}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                loadedCount++;

                if (!err && spriteFrame) {
                    this.bodySprites.push(spriteFrame);
                    console.log(`加载皮肤资源 ${i} 成功，当前皮肤数量:`, this.bodySprites.length);
                } else {
                    console.error(`加载皮肤资源 ${i} 失败:`, err);
                }

                // 所有资源加载完成后执行回调
                if (loadedCount >= totalCount && callback) {
                    callback();
                }
            });
        }
    }

    // 根据SnakeModel创建对应的显示节点
    private createDisplayNodesForModel(): void {
        const requiredNodeCount = this.getRequiredNodeCount();
        console.log('需要创建的显示节点数量:', requiredNodeCount);

        // 确保有足够的显示节点
        this.ensureBodyNodes(requiredNodeCount);

        // 验证节点数量一致性
        this.checkAndSyncNodeCount();
    }

    // 获取需要的节点数量
    private getRequiredNodeCount(): number {
        // 返回SnakeModel的身体节点数量（不包括头部）
        return this.snakeModel.bodyPartCount;
    }

    // 检查并同步节点数量
    private checkAndSyncNodeCount(): void {
        const requiredCount = this.getRequiredNodeCount();
        const currentCount = this.bodyNodes.length;

        console.log(`节点数量检查 - 需要身体节点: ${requiredCount}, 当前显示节点: ${currentCount}`);

        if (currentCount > requiredCount) {
            console.log('移除多余的显示节点');
            this.removeExcessNodes(requiredCount);
        } else if (currentCount < requiredCount) {
            console.log('创建缺少的显示节点');
            this.ensureBodyNodes(requiredCount);
        }

        console.log(`节点数量同步完成 - 当前显示节点数量: ${this.bodyNodes.length} (只显示身体节点)`);
    }

    // 移除多余的节点
    private removeExcessNodes(keepCount: number): void {
        while (this.bodyNodes.length > keepCount) {
            const removedNode = this.bodyNodes.pop();
            if (removedNode) {
                removedNode.destroy();
                console.log('移除多余显示节点');
            }
        }
    }

    // 更新蛇的显示
    updateSnakeDisplay(): void {
        // console.log('开始更新蛇显示...');

        // 更新头部位置和旋转
        this.updateHead();

        // 更新身体节点
        this.updateBodyNodes();

        // console.log('蛇显示更新完成');
    }

    // 更新头部
    private updateHead(): void {
        const position = this.snakeModel.position;
        const direction = this.snakeModel.direction;

        // 设置头部位置
        this.head.setPosition(position.x, position.y, 0);

        // 设置头部旋转（根据移动方向）
        if (!direction.equals(Vec2.ZERO)) {
            const angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
            this.head.setRotationFromEuler(0, 0, angle);
        }

    }

    // 更新身体节点
    private updateBodyNodes(): void {
        const bodyParts = this.snakeModel.bodyParts;
        const bodyPartCount = this.snakeModel.bodyPartCount;

        // 检查并同步节点数量
        this.checkAndSyncNodeCount();

        // 确保有足够的身体节点（只创建身体节点，不包括头部）
        this.ensureBodyNodes(bodyPartCount);

        console.log(`更新身体节点 - 模型总节点数量: ${bodyParts.length}, 身体节点数量: ${bodyPartCount}, 显示节点数量: ${this.bodyNodes.length}`);

        // 更新每个身体节点的位置（从索引1开始，跳过头部）
        for (let i = 1; i < bodyParts.length; i++) {
            const bodyPart = bodyParts[i];
            const bodyNodeIndex = i - 1; // 显示节点索引从0开始
            const bodyNode = this.bodyNodes[bodyNodeIndex];

            if (bodyNode) {
                // 设置身体节点位置
                bodyNode.setPosition(bodyPart.x, bodyPart.y, 0);

                // 激活身体节点
                bodyNode.active = true;

                // 设置身体节点皮肤（使用身体节点索引）
                this.setBodyNodeSprite(bodyNode, bodyNodeIndex);

                console.log(`身体节点 ${bodyNodeIndex} 更新 - 模型位置: (${bodyPart.x}, ${bodyPart.y}), 节点可见: ${bodyNode.active}`);
            } else {
                console.warn(`身体节点 ${bodyNodeIndex} 不存在，跳过更新`);
            }
        }

        // 隐藏多余的身体节点
        for (let i = bodyPartCount; i < this.bodyNodes.length; i++) {
            if (this.bodyNodes[i]) {
                this.bodyNodes[i].active = false;
                console.log(`隐藏多余身体节点 ${i}`);
            }
        }
    }

    // 确保有足够的身体节点
    private ensureBodyNodes(count: number): void {
        console.log(`确保身体节点数量 - 需要: ${count} (身体节点), 当前: ${this.bodyNodes.length} (显示节点)`);

        // 创建缺少的身体节点
        while (this.bodyNodes.length < count) {
            const bodyNode = this.createBodyNode();
            this.bodyNodes.push(bodyNode);
            console.log(`创建身体显示节点 ${this.bodyNodes.length - 1}`);
        }

        console.log(`身体节点数量确认 - 当前显示节点数量: ${this.bodyNodes.length}`);
    }

    // 创建身体节点
    private createBodyNode(): Node {
        const bodyNode = new Node('BodyPart');
        bodyNode.setParent(this.bodyContainer);

        // 添加Sprite组件
        const sprite = bodyNode.addComponent(Sprite);

        // 设置默认皮肤
        if (this.bodySprites.length > 0) {
            sprite.spriteFrame = this.bodySprites[0];
            console.log('设置身体节点默认皮肤成功');
        } else {
            console.warn('没有可用的皮肤资源，使用默认设置');
        }

        // 设置默认大小
        // bodyNode.setScale(0.8, 0.8, 1);

        // 确保节点可见
        bodyNode.active = true;

        console.log(`创建身体节点完成 - 节点名称: ${bodyNode.name}, 可见: ${bodyNode.active}, 父节点: ${this.bodyContainer.name}`);

        return bodyNode;
    }

    // 设置身体节点皮肤
    private setBodyNodeSprite(bodyNode: Node, index: number): void {
        const sprite = bodyNode.getComponent(Sprite);
        if (sprite && this.bodySprites.length > 0) {
            // 根据索引选择皮肤，确保每个身体节点都有不同的皮肤
            const spriteIndex = index % this.bodySprites.length;
            sprite.spriteFrame = this.bodySprites[spriteIndex];

            console.log(`设置身体节点 ${index} 皮肤 - 皮肤索引: ${spriteIndex}, 可用皮肤数量: ${this.bodySprites.length}`);
        } else {
            console.warn(`无法设置身体节点 ${index} 皮肤 - 皮肤组件或资源不可用`);
        }
    }

    // 添加身体节点
    addBodyNode(): void {
        const bodyNode = this.createBodyNode();
        this.bodyNodes.push(bodyNode);
        bodyNode.active = true;

        console.log(`添加身体节点 - 当前显示节点数量: ${this.bodyNodes.length}`);

        // 验证节点数量一致性
        this.checkAndSyncNodeCount();
    }

    // 移除身体节点
    removeBodyNode(): void {
        if (this.bodyNodes.length > 0) {
            const lastNode = this.bodyNodes.pop();
            if (lastNode) {
                lastNode.destroy();
                console.log(`移除身体节点 - 当前显示节点数量: ${this.bodyNodes.length}`);
            }
        }

        // 验证节点数量一致性
        this.checkAndSyncNodeCount();
    }

    // 获取头部节点
    getHead(): Node {
        return this.head;
    }

    // 获取身体容器节点
    getBodyContainer(): Node {
        return this.bodyContainer;
    }

    // 设置蛇的可见性
    setVisible(visible: boolean): void {
        this.head.active = visible;
        this.bodyContainer.active = visible;
    }

    // 测试验证方法
    debugNodeCount(): void {
        const modelCount = this.snakeModel ? this.snakeModel.bodyPartCount : 0;
        const displayCount = this.bodyNodes.length;
        const totalModelNodes = this.snakeModel ? this.snakeModel.bodyParts.length : 0;

        console.log('=== 节点数量验证 ===');
        console.log(`模型总节点数量: ${totalModelNodes} (包括头部)`);
        console.log(`模型身体节点数量: ${modelCount} (不包括头部)`);
        console.log(`显示节点数量: ${displayCount} (只显示身体)`);
        console.log(`节点数量是否一致: ${modelCount === displayCount ? '是' : '否'}`);

        if (modelCount !== displayCount) {
            console.warn('节点数量不一致！');
            console.warn(`期望的身体节点数量: ${modelCount}, 实际的显示节点数量: ${displayCount}`);
        }
        console.log('=== 节点数量验证结束 ===');
    }

    // 组件销毁时清理
    onDestroy(): void {
        // 清理身体节点
        this.bodyNodes.forEach(node => {
            if (node.isValid) {
                node.destroy();
            }
        });
        this.bodyNodes = [];
    }
} 