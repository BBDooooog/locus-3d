# Locus — 3D Trajectory Viewer

浏览器端 3D 运动轨迹查看器。拖入 GPX 文件，即刻看到轨迹的空间形态。

## 快速开始

```bash
npm install
npm run dev      # → http://localhost:5173
```

拖入 `.gpx` 文件即可看到效果，项目自带一份 `public/sample.gpx` 示例。

## 特性

- **拖拽上传** — 拖入 GPX 文件即刻渲染，页面任意区域可拖拽
- **4 层空间可视化** — 参考平面 + 空间轨迹 + 垂直投影线 + 地面投影，无需地图即可感知空间形态
- **6 种颜色映射** — 海拔 / 速度 / 心率 / 步频 / 坡度 / 单色
- **海拔夸张** — 1x ~ 10x 可调，突出地形起伏
- **整体缩放** — 0.2x ~ 1.0x，适配不同规模的轨迹
- **Flyover 飞行** — 相机沿轨迹自动飞行浏览
- **自动旋转** — 支持速度调节
- **图层开关** — 参考平面、投影线、地面投影、方向标、起终点可独立勾选
- **方向标** — 参考平面中心 N/S/E/W 十字标
- **起终点标记** — 绿色起点球 + 红色终点球
- **轨迹统计** — 距离、累计爬升、总时长、平均速度
- **截图导出** — 一键下载 PNG
- **键盘快捷键** — `Space` 旋转 · `R` 重置 · `F` 飞行 · `1-5` 颜色 · `↑↓` 海拔比例
- **暗色主题** — 工具栏 3 秒自动隐藏，底部 hover 呼出

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 5 |
| 3D 引擎 | Three.js + Line2 宽线 |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 坐标转换 | WGS84 → ECEF → ENU（自实现） |
| GPX 解析 | 浏览器 DOMParser |

## 项目结构

```
src/
├── types/track.ts               # 类型定义
├── store/useViewerStore.ts      # Zustand 全局状态
├── parser/gpxParser.ts          # GPX 解析
├── transform/                   # WGS84 → ECEF → ENU
│   ├── wgs84.ts
│   ├── ecef.ts
│   └── index.ts
├── geometry/                    # Three.js 几何构建
│   ├── trajectoryBuilder.ts     # Line2 轨迹
│   ├── colorBuilder.ts          # 顶点颜色
│   ├── markerBuilder.ts         # 起终点球
│   └── sceneLayers.ts           # 参考平面 / 投影线 / 地面投影 / 方向标
├── viewer/                      # React + Three.js 桥接
│   ├── SceneCanvas.tsx          # 画布 + 键盘快捷键
│   ├── useScene.ts              # 场景初始化
│   ├── useTrajectory.ts         # 轨迹 + 图层管理
│   └── useFlyover.ts            # 飞行动画
├── ui/                          # UI 组件
│   ├── DropZone.tsx             # 拖拽上传
│   ├── Toolbar.tsx              # 底部工具栏
│   ├── TrackInfoCard.tsx        # 轨迹统计
│   ├── ColorLegend.tsx          # 颜色图例
│   └── KeyboardHint.tsx         # 快捷键提示
└── utils/
    ├── trackStats.ts            # 距离 / 爬升 / 速度
    ├── colorScale.ts            # Turbo 256 色阶
    └── format.ts                # 格式化
```

## License

MIT
