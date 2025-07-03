import { _decorator, Vec2 } from 'cc';

/**
 * 蛇身体节点 - 双向链表节点
 */
export class SnakeNode {
    // 节点位置
    public position: Vec2;

    // 上一帧位置
    public previousPosition: Vec2;

    // 前一个节点
    public prev: SnakeNode | null = null;

    // 后一个节点
    public next: SnakeNode | null = null;

    // 节点索引（用于调试）
    public index: number = 0;

    constructor(pos: Vec2, index: number = 0) {
        this.position = pos.clone();
        this.previousPosition = pos.clone();
        this.index = index;
    }

    /**
     * 设置位置
     */
    setPosition(pos: Vec2): void {
        this.position.set(pos);
    }

    /**
     * 获取位置副本
     */
    getPosition(): Vec2 {
        return this.position.clone();
    }

    /**
     * 保存当前位置到上一帧位置
     */
    saveCurrentToPrevious(): void {
        this.previousPosition.set(this.position);
    }

    /**
     * 获取上一帧位置
     */
    getPreviousPosition(): Vec2 {
        return this.previousPosition.clone();
    }

    /**
     * 移动到上一帧位置
     */
    moveToPreviousPosition(): void {
        this.position.set(this.previousPosition);
    }

    /**
     * 计算与前一个节点的距离
     */
    getDistanceToPrev(): number {
        if (!this.prev) return 0;
        return Vec2.distance(this.position, this.prev.position);
    }

    /**
     * 计算与后一个节点的距离
     */
    getDistanceToNext(): number {
        if (!this.next) return 0;
        return Vec2.distance(this.position, this.next.position);
    }
} 