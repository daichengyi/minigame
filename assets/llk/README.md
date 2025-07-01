# 连连看游戏 - MVC架构重构

## 项目概述

这是一个基于 Cocos Creator 引擎开发的连连看游戏，使用 MVC（Model-View-Controller）架构模式重构，提高了代码的可维护性、可扩展性和可测试性。

## 项目结构

```
assets/llk/
├── llk.ts                    # 主组件，MVC架构的入口
├── models/
│   └── GameModel.ts          # 游戏数据模型
├── views/
│   └── GameView.ts           # 游戏视图层
├── controllers/
│   └── GameController.ts     # 游戏控制器
├── utils/
│   └── PathFinder.ts         # 路径查找工具类
└── README.md                 # 项目说明文档
```

## MVC架构说明

### Model（模型层）- GameModel.ts
负责管理游戏的核心数据和业务逻辑：
- 游戏配置管理
- 方块数据管理
- 网格状态管理
- 游戏状态管理（选中、消除等）
- 数据验证和业务规则

**主要功能：**
- 方块数据的创建和管理
- 选中状态的维护
- 网格状态的更新
- 游戏结束条件检查
- 提供数据访问接口

### View（视图层）- GameView.ts
负责游戏的UI显示和用户交互：
- 方块的可视化渲染
- 用户输入处理
- 连线绘制
- 网格显示
- 游戏状态的可视化反馈

**主要功能：**
- 方块节点的创建和管理
- 资源加载和图片设置
- 点击事件处理
- 连线绘制
- 选中状态的可视化
- 游戏胜利界面

### Controller（控制器层）- GameController.ts
负责协调Model和View，处理游戏逻辑：
- 接收用户输入
- 调用Model进行数据处理
- 通知View更新显示
- 游戏流程控制

**主要功能：**
- 游戏初始化
- 方块点击处理
- 消除逻辑控制
- 游戏状态管理
- 配置管理

### Utils（工具层）- PathFinder.ts
提供独立的工具功能：
- A*寻路算法
- 路径查找逻辑
- 连接验证

## 核心特性

### 1. 模块化设计
- 每个模块职责单一，易于维护
- 模块间依赖关系清晰
- 便于单元测试

### 2. 数据驱动
- 游戏逻辑与显示逻辑分离
- 数据变化自动反映到界面
- 便于添加新功能

### 3. 可扩展性
- 易于添加新的游戏模式
- 支持不同的UI主题
- 便于集成新的算法

### 4. 可测试性
- 业务逻辑与UI分离
- 便于编写单元测试
- 支持模拟测试

## 使用方法

### 基本使用
```typescript
// 在场景中挂载llk组件
// 设置content和block节点引用
// 游戏会自动初始化并开始
```

### 公共API
```typescript
// 重新开始游戏
llkComponent.restartGame();

// 设置游戏配置
llkComponent.setGameConfig(rows, cols, blockWidth, blockHeight);

// 显示/隐藏网格
llkComponent.showGrid();
llkComponent.hideGrid();

// 获取游戏信息
const gameInfo = llkComponent.getGameInfo();
```

## 配置说明

### 游戏配置参数
```typescript
interface GameConfig {
    rows: number;           // 行数
    cols: number;           // 列数
    blockWidth: number;     // 方块宽度
    blockHeight: number;    // 方块高度
    blockSpacing: number;   // 方块间距
}
```

### 默认配置
- 行数：12
- 列数：10
- 方块尺寸：60×60
- 间距：2

## 扩展指南

### 添加新的游戏模式
1. 在GameModel中添加新的游戏状态
2. 在GameController中添加相应的逻辑处理
3. 在GameView中添加对应的UI显示

### 添加新的方块类型
1. 准备新的图片资源
2. 在GameView中加载新资源
3. 在GameModel中扩展方块类型逻辑

### 添加新的连接规则
1. 在PathFinder中添加新的路径查找算法
2. 在GameController中集成新的规则
3. 在GameView中添加相应的视觉效果

## 性能优化

### 已实现的优化
- 对象池管理方块节点
- 高效的A*寻路算法
- 事件驱动的UI更新
- 资源异步加载

### 建议的优化
- 添加方块缓存机制
- 优化路径查找算法
- 实现视图虚拟化
- 添加资源预加载

## 测试建议

### 单元测试
- 测试GameModel的数据操作
- 测试PathFinder的算法正确性
- 测试GameController的业务逻辑

### 集成测试
- 测试完整的游戏流程
- 测试用户交互响应
- 测试异常情况处理

## 注意事项

1. 确保资源路径正确（llk/1 到 llk/9）
2. 方块节点需要包含Sprite组件
3. 内容节点需要正确设置尺寸
4. 注意内存管理，及时清理无用对象

## 版本历史

- v2.0.0: MVC架构重构
- v1.0.0: 原始版本

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。在提交代码前，请确保：
1. 代码符合项目的编码规范
2. 添加必要的注释和文档
3. 通过相关的测试
4. 遵循MVC架构原则 