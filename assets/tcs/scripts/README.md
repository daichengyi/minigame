# 贪吃蛇游戏 - 第一阶段：摇杆控制系统

## 实现概述
第一阶段实现了完整的摇杆控制系统，采用MVC架构设计，包含以下组件：

### 文件结构
```
scripts/
├── model/
│   └── JoystickModel.ts      // 摇杆数据模型
├── view/
│   └── JoystickView.ts       // 摇杆视图组件
├── controller/
│   └── JoystickController.ts // 摇杆控制器
├── TestJoystick.ts           // 摇杆测试脚本
└── README.md                 // 说明文档
```

## 核心功能

### 1. JoystickModel（数据模型）
- **摇杆状态管理**：激活状态、位置、方向
- **参数配置**：最大半径225像素、最小角度阈值15度
- **方向计算**：标准化方向向量、角度计算
- **边界限制**：限制摇杆在最大半径内移动

### 2. JoystickView（视图组件）
- **UI显示**：摇杆背景和摇杆点的显示
- **动画效果**：松开后0.2秒回中动画
- **位置更新**：实时更新摇杆点位置

### 3. JoystickController（控制器）
- **触摸处理**：处理触摸开始、移动、结束事件
- **坐标转换**：世界坐标到UI节点坐标的转换
- **区域检测**：检测触摸是否在摇杆区域内
- **事件回调**：方向变化时的回调机制

## 技术特性

### 摇杆控制
- ✅ 360度旋转控制
- ✅ joystickPoint跟随移动
- ✅ 松开后自动回中动画
- ✅ 最大移动半径225像素限制
- ✅ 最小角度阈值15度过滤

### 触摸处理
- ✅ 支持移动端触摸
- ✅ 精确的触摸区域检测
- ✅ 平滑的拖拽体验

### 架构设计
- ✅ MVC模式分离
- ✅ 模块化设计
- ✅ 可扩展接口

## 使用方法

### 1. 在场景中配置
1. 将`JoystickView`组件添加到joystick节点
2. 将`JoystickController`组件添加到joystick节点
3. 在Inspector中配置组件引用

### 2. 代码集成
```typescript
// 获取摇杆控制器
const joystickController = this.getComponent(JoystickController);

// 设置方向变化回调
joystickController.setDirectionChangeCallback((direction: Vec2) => {
    // 处理摇杆方向变化
    console.log('摇杆方向:', direction);
});
```

### 3. 测试验证
- 添加`TestJoystick`组件进行功能测试
- 在控制台查看摇杆状态输出

## 下一步计划
- 第二阶段：实现蛇的基础移动系统
- 集成摇杆控制到蛇的移动逻辑
- 添加相机跟随功能

## 注意事项
- 确保UI相机正确配置
- 摇杆节点需要正确的UITransform组件
- 触摸事件需要全局注册 