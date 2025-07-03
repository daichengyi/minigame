import { Vec2 } from 'cc';
import { SnakeNode } from './SnakeNode';

/**
 * 蛇身体管理 - 双向链表实现
 */
export class SnakeBody {
    // 头部节点
    private head: SnakeNode | null = null;

    // 尾部节点
    private tail: SnakeNode | null = null;

    // 节点数量
    private length: number = 0;

    // 最大节点数量
    private maxLength: number = 10;

    // 节点间距
    private spacing: number = 30;

    /**
     * 获取节点数量
     */
    getLength(): number {
        return this.length;
    }

    /**
     * 获取头部节点
     */
    getHead(): SnakeNode | null {
        return this.head;
    }

    /**
     * 获取尾部节点
     */
    getTail(): SnakeNode | null {
        return this.tail;
    }

    /**
     * 设置最大长度
     */
    setMaxLength(maxLength: number): void {
        this.maxLength = maxLength;
    }

    /**
     * 设置节点间距
     */
    setSpacing(spacing: number): void {
        this.spacing = spacing;
    }

    /**
     * 初始化蛇身体
     */
    init(startPosition: Vec2, bodyCount: number = 2): void {
        this.clear();

        // 创建头部节点
        this.head = new SnakeNode(startPosition, 0);
        this.tail = this.head;
        this.length = 0;

        console.log('创建头部节点:', startPosition.x, startPosition.y);

        // 创建身体节点
        for (let i = 1; i <= bodyCount; i++) {
            const bodyPos = new Vec2();
            // 身体节点在头部左侧，间距递增
            bodyPos.set(startPosition.x - this.spacing * i, startPosition.y);
            this.addBodyNode(bodyPos);
            console.log(`创建身体节点${i}:`, bodyPos.x, bodyPos.y);
        }

        console.log('蛇身体初始化完成，节点数量:', this.length);
        this.debugInfo();
    }

    /**
     * 添加身体节点
     */
    addBodyNode(position: Vec2): void {
        if (this.length >= this.maxLength) {
            console.warn('已达到最大身体节点数量');
            return;
        }

        const newNode = new SnakeNode(position, this.length);

        if (!this.tail) {
            // 如果没有节点，创建头部
            this.head = newNode;
            this.tail = newNode;
        } else {
            // 添加到尾部
            newNode.prev = this.tail;
            this.tail.next = newNode;
            this.tail = newNode;
        }

        this.length++;
    }

    /**
     * 移除尾部节点
     */
    removeTailNode(): void {
        if (!this.tail || this.length <= 1) {
            console.warn('无法移除尾部节点');
            return;
        }

        const newTail = this.tail.prev;
        if (newTail) {
            newTail.next = null;
            this.tail = newTail;
            this.length--;
        }
    }

    /**
     * 移动头部并更新身体跟随
     */
    moveHeadAndFollow(newPosition: Vec2): void {
        if (!this.head) return;

        // 保存头部当前位置到上一帧位置
        this.head.saveCurrentToPrevious();

        // 移动头部到新位置
        this.head.setPosition(newPosition);

        // 更新身体节点跟随 - 基于上一帧位置的跟随算法
        this.updateBodyFollow();
    }

    /**
     * 更新身体节点跟随 - 基于上一帧位置的跟随算法
     */
    private updateBodyFollow(): void {
        if (!this.head || this.length <= 1) return;

        console.log('=== 开始身体跟随更新 ===');
        console.log('链表长度:', this.length);
        console.log('身体间距:', this.spacing);

        // 基于上一帧位置的跟随算法：
        // 1. 先保存所有节点的当前位置到上一帧位置
        // 2. 从第一个身体节点开始，每个节点移动到其前一个节点的上一帧位置，并保持固定间距

        // 第一步：保存所有节点的当前位置到上一帧位置
        let current = this.head;
        while (current) {
            current.saveCurrentToPrevious();
            current = current.next;
        }

        // 第二步：更新身体节点位置，保持固定间距
        current = this.head.next; // 从第一个身体节点开始
        while (current) {
            const prevNode = current.prev;
            if (!prevNode) break;

            // 计算从前一个节点当前位置到上一帧位置的方向
            const direction = new Vec2();
            Vec2.subtract(direction, prevNode.getPreviousPosition(), prevNode.getPosition());

            // 如果方向向量长度大于0，则标准化；否则使用默认方向
            if (direction.length() > 0.001) {
                direction.normalize();
            } else {
                // 如果前一个节点没有移动，使用默认方向（向后）
                direction.set(-1, 0);
            }

            // 计算目标位置：前一个节点的上一帧位置 + 间距
            const targetPosition = new Vec2();
            Vec2.multiplyScalar(targetPosition, direction, this.spacing);
            Vec2.add(targetPosition, prevNode.getPreviousPosition(), targetPosition);

            console.log(`身体节点${current.index} 从 (${current.position.x}, ${current.position.y}) 移动到 (${targetPosition.x}, ${targetPosition.y})`);
            current.setPosition(targetPosition);

            current = current.next;
        }

        console.log('=== 身体跟随更新完成 ===');
    }

    /**
     * 获取所有节点位置（保持接口兼容）
     */
    getAllPositions(): Vec2[] {
        const positions: Vec2[] = [];
        let current = this.head;

        while (current) {
            positions.push(current.getPosition());
            current = current.next;
        }

        return positions;
    }

    /**
     * 获取指定索引的节点
     */
    getNodeAt(index: number): SnakeNode | null {
        if (index < 0 || index >= this.length) return null;

        let current = this.head;
        let count = 0;

        while (current && count < index) {
            current = current.next;
            count++;
        }

        return current;
    }

    /**
     * 清空所有节点
     */
    clear(): void {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    /**
     * 调试信息
     */
    debugInfo(): void {
        console.log('蛇身体调试信息:');
        console.log('节点数量:', this.length);
        console.log('最大长度:', this.maxLength);
        console.log('间距:', this.spacing);

        let current = this.head;
        let index = 0;
        while (current) {
            console.log(`节点${index}: (${current.position.x}, ${current.position.y})`);
            current = current.next;
            index++;
        }
    }

    /**
     * 基于路径历史更新身体位置
     */
    updateBodyByPath(pathHistory: Vec2[], bodySpacing: number): void {
        if (!this.head || this.length <= 1 || pathHistory.length === 0) return;

        console.log('=== 开始基于路径的身体更新 ===');
        console.log('路径历史长度:', pathHistory.length);
        console.log('身体间距:', bodySpacing);

        // 从第一个身体节点开始更新
        let current = this.head.next;
        let bodyIndex = 1;

        while (current) {
            // 计算这个身体节点应该跟随的路径距离
            const followDistance = bodyIndex * bodySpacing;

            // 根据距离获取目标路径点
            const targetPosition = this.getPathPointAtDistance(pathHistory, followDistance);

            if (targetPosition) {
                console.log(`身体节点${bodyIndex} 移动到路径点: (${targetPosition.x}, ${targetPosition.y})`);
                current.setPosition(targetPosition);
            } else {
                console.log(`身体节点${bodyIndex} 没有找到对应的路径点`);
            }

            current = current.next;
            bodyIndex++;
        }

        console.log('=== 基于路径的身体更新完成 ===');
    }

    /**
     * 根据距离获取路径点
     */
    private getPathPointAtDistance(pathHistory: Vec2[], distance: number): Vec2 | null {
        if (pathHistory.length === 0) {
            return null;
        }

        // 计算目标路径点索引
        const pathSpacing = 5; // 与SnakeModel中的路径点间距保持一致
        const targetIndex = Math.floor(distance / pathSpacing);

        if (targetIndex >= pathHistory.length) {
            return null;
        }

        return pathHistory[targetIndex].clone();
    }
}