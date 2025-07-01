# 贪吃蛇游戏 - MVC架构重构

## 项目概述
这是一个基于 Cocos Creator 3.8.5 引擎开发的贪吃蛇游戏
Cocos Creator 3.8.5 API地址：
https://docs.cocos.com/creator/3.8/manual/zh/
https://docs.cocos.com/creator/3.8/api/zh/

使用 MVC（Model-View-Controller）模式，注重代码的可维护性、可扩展性和可测试性

## 项目需求
tcs.ts 是入口脚本代码

一、实现摇杆控制贪吃蛇移动
摇杆预制件结构如下
├── joystick
│   └── joystickBg
│       └── joystickPoint
摇杆预制件joystick已创建，需要实现摇杆功能，360度旋转，joystickPoint跟随移动，松开后默认居中

二、贪吃蛇逻辑
蛇预制件结构
├── snake
│   └── head

分为头、身体、尾巴
每个部分保持一定间距
头根据摇杆方向转向，添加可控制速度字段
考虑吃到道具身体会边长情况
考虑身体会被破坏一节情况

三、资源及预制件
图片资源路径：resources/tcs  命名0是蛇头，1-8为身体皮肤，-1是尾巴资源

四、相机
Camera相机，需要跟随当前蛇移动，相机的Layer层是 game层
UICamera相机，显示游戏UI


#需要确认的技术细节
1. 摇杆控制相关
摇杆的最大移动半径是225，需要限制在joystickBg范围内
摇杆的灵敏度不可配置的移动速度
摇杆松开后回中的动画效果
2. 贪吃蛇移动相关
蛇的移动是平滑移动
蛇的移动速度是固定的
身体节点之间的间距具体是20像素
蛇的转向是否有最小角度限制，15度
3. 游戏机制相关
道具系统暂时包含增长身体道具
身体被破坏的触发条件暂定
游戏边界暂定无限
无计分系统
4. 资源使用相关
身体皮肤1-8.png是随机使用
蛇头需要根据移动方向旋转
尾巴无特殊处理
5. 项目配置相关
需要支持移动端
需要暂停功能
不需要音效系统


#实现计划
基于MVC架构，我计划按以下顺序实现：
第一阶段：摇杆控制系统
JoystickController：处理摇杆输入
JoystickView：摇杆UI显示
第二阶段：蛇的基础移动
SnakeModel：蛇的数据模型
SnakeController：移动逻辑
SnakeView：蛇的显示
第三阶段：相机跟随系统
CameraController：相机跟随逻辑
第四阶段：身体管理系统
动态添加/删除身体
碰撞检测
第五阶段：游戏逻辑完善
道具系统
暂停功能