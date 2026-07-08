我建议这份 Spec 不要写成「Three.js 如何使用」，而应该写成**AI Native Spec**，也就是开发 Agent 可以直接实现的规格。

下面是一份接近生产级的 Spec，目标是：

> **Garmin / GPX / FIT → Three.js 3D Trajectory Viewer**

---

# 3D Trajectory Viewer Spec v1.0

## 1. Goal

实现一个浏览器端 3D 运动轨迹查看器。

支持 Garmin、GPX、FIT 等轨迹数据，将二维 GPS 轨迹转换为空间轨迹，以 Three.js 渲染，不依赖地图或地球，仅展示轨迹本身的空间形态。

目标效果：

- 轨迹悬浮于三维空间
    
- 支持自动旋转
    
- 支持自由观察
    
- 支持按海拔着色
    
- 支持海拔倍率调整
    
- 后续支持 Flyover 动画
    

---

# 2. Architecture

```text
                File Upload
                     │
                     ▼
             Track Parser
         (FIT / GPX / TCX)
                     │
                     ▼
          Standard Track Model
                     │
                     ▼
         Coordinate Transformer
          WGS84 -> Local ENU
                     │
                     ▼
          Geometry Builder
                     │
                     ▼
          Three.js Viewer
                     │
     ┌───────────────┼──────────────┐
     ▼               ▼              ▼
 OrbitControls   AutoRotate     Flyover
```

---

# 3. Module

```
viewer/

    parser/
        fitParser.ts
        gpxParser.ts
        tcxParser.ts

    transform/
        wgs84.ts
        ecef.ts
        enu.ts

    geometry/
        trajectoryBuilder.ts
        colorBuilder.ts
        markerBuilder.ts

    viewer/
        scene.ts
        camera.ts
        renderer.ts
        controls.ts

    animation/
        flyover.ts

    ui/
        toolbar.ts

```

---

# 4. Standard Track Model

所有 Parser 最终输出统一数据结构：

```typescript
interface TrackPoint {

    lat:number

    lng:number

    altitude:number

    timestamp:number

    speed?:number

    heartRate?:number

    cadence?:number

}

interface Track {

    points:TrackPoint[]

}
```

禁止 Parser 输出 Three.js 对象。

Parser 只负责解析。

---

# 5. Coordinate Transform

禁止直接使用经纬度作为 Three.js 坐标。

必须：

```
WGS84

↓

ECEF

↓

ENU(Local)

↓

Three.js
```

坐标映射：

```
East

↓

Three.x

North

↓

Three.z

Up

↓

Three.y
```

最终：

```
Vector3(

    east,

    up,

    north

)
```

---

# 6. Vertical Exaggeration

默认：

```
Altitude Scale = 3
```

可配置：

```
1x

2x

3x

5x

10x
```

实现：

```
up *= altitudeScale
```

UI 必须支持实时调整。

Geometry 自动更新。

---

# 7. Geometry Builder

输入：

```
Track
```

输出：

```
BufferGeometry
```

要求：

使用

```
BufferGeometry
```

禁止：

```
Geometry
```

因为已废弃。

Position：

```
Float32Array
```

一次性写入。

禁止：

```
new Vector3()

push()

频繁创建对象
```

---

# 8. Line Material

默认：

```
Line2

(LineSegments2)
```

不要：

```
LineBasicMaterial
```

原因：

浏览器线宽限制。

必须支持：

```
width

opacity

color

```

---

# 9. Color Mode

支持：

```
Single Color

Altitude

Speed

Heart Rate

Cadence

Gradient
```

颜色计算：

```
Track

↓

ColorBuilder

↓

Float32 Color Buffer

↓

Geometry Attribute
```

不得运行时每帧计算颜色。

---

# 10. Scene

Scene 包含：

```
Trajectory

Grid

Axis

Start Marker

End Marker

```

默认：

```
GridHelper

AxesHelper
```

---

# 11. Camera

默认：

```
PerspectiveCamera
```

FOV：

```
45°
```

Near：

```
0.1
```

Far：

```
100000
```

加载轨迹后：

自动：

```
Fit To Bounding Box
```

禁止固定 Camera。

---

# 12. Orbit Controls

默认：

```
OrbitControls
```

开启：

```
Damping

Rotate

Zoom

Pan

```

默认：

```
AutoRotate

false
```

可开启：

```
true
```

---

# 13. Auto Rotate

围绕：

```
Bounding Box Center
```

旋转。

速度：

```
0~10
```

支持：

```
Play

Pause
```

---

# 14. Bounding Box

加载 Geometry 后：

计算：

```
Box3
```

得到：

```
Center

Size

Radius
```

用于：

```
Camera

Rotate Center

Flyover

```

---

# 15. Start End Marker

自动生成：

```
Start

Sphere

Green
```

```
End

Sphere

Red
```

Marker 大小：

```
根据 Camera Distance

自动缩放
```

避免缩放后过小。

---

# 16. Flyover

输入：

```
Track
```

生成：

```
CatmullRomCurve3
```

相机：

```
position

=

curve.getPointAt(t)
```

LookAt：

```
curve.getPointAt(t+0.01)
```

支持：

```
Play

Pause

Replay

Speed
```

---

# 17. Performance

目标：

```
100000 points

60 FPS
```

要求：

Geometry：

```
BufferGeometry
```

Color：

```
Float32Array
```

Position：

```
Float32Array
```

一次上传 GPU。

禁止：

```
每帧：

new Vector3()

setFromPoints()

重新创建 Geometry
```

---

# 18. UI

Toolbar：

```
Altitude Scale

Color Mode

Auto Rotate

Flyover

Reset Camera

Screenshot
```

---

# 19. API

```
loadTrack(track)

setAltitudeScale(scale)

setColorMode(mode)

playFlyover()

pauseFlyover()

fitCamera()

resetCamera()

toggleAutoRotate()

takeScreenshot()

dispose()
```

---

# 20. Future Extension

支持：

```
DEM Terrain

Heat Map

Split Segment

Waypoint

Photo

Checkpoint

Elevation Profile

Multiple Tracks

Realtime Track

Replay

VR

AR
```

---

# 21. 推荐技术栈

|模块|推荐|
|---|---|
|3D 引擎|Three.js|
|相机控制|OrbitControls|
|粗线渲染|Line2（examples 中的宽线实现）|
|坐标转换|自实现 WGS84 → ECEF → ENU，或使用成熟地理坐标库|
|FIT 解析|`fit-file-parser` 或其他 FIT 解析库|
|GPX 解析|XML Parser|
|状态管理|Zustand（React）或 Pinia（Vue）均可|
|UI|React + TypeScript（推荐）或 Vue 3 + TypeScript|

---

## v2 版本建议（产品级）

如果你的目标是做一个类似 Garmin Connect、Strava 的专业轨迹平台，我建议把 Viewer 拆成一个**可复用的 SDK**，而不是页面组件。

例如：

```text
packages/
├── trajectory-core          // 数据模型、坐标转换
├── trajectory-parser        // FIT/GPX/TCX 解析
├── trajectory-renderer      // Three.js 渲染核心
├── trajectory-ui            // Toolbar、控制面板
├── trajectory-react         // React 封装
├── trajectory-vue           // Vue 封装
└── demo                     // 示例应用
```

这样后续无论是 Web、Electron，还是你的运动平台管理后台，都可以直接复用同一套渲染能力。随着需求增加（多轨迹对比、照片时间轴、实时轨迹、DEM 地形、Flyover、轨迹分析等），也不会因为架构耦合而需要大规模重构。我建议这份 Spec 不要写成「Three.js 如何使用」，而应该写成**AI Native Spec**，也就是开发 Agent 可以直接实现的规格。

下面是一份接近生产级的 Spec，目标是：

> **Garmin / GPX / FIT → Three.js 3D Trajectory Viewer**

---

# 3D Trajectory Viewer Spec v1.0

## 1. Goal

实现一个浏览器端 3D 运动轨迹查看器。

支持 Garmin、GPX、FIT 等轨迹数据，将二维 GPS 轨迹转换为空间轨迹，以 Three.js 渲染，不依赖地图或地球，仅展示轨迹本身的空间形态。

目标效果：

* 轨迹悬浮于三维空间
* 支持自动旋转
* 支持自由观察
* 支持按海拔着色
* 支持海拔倍率调整
* 后续支持 Flyover 动画

---

# 2. Architecture

```text
                File Upload
                     │
                     ▼
             Track Parser
         (FIT / GPX / TCX)
                     │
                     ▼
          Standard Track Model
                     │
                     ▼
         Coordinate Transformer
          WGS84 -> Local ENU
                     │
                     ▼
          Geometry Builder
                     │
                     ▼
          Three.js Viewer
                     │
     ┌───────────────┼──────────────┐
     ▼               ▼              ▼
 OrbitControls   AutoRotate     Flyover
```

---

# 3. Module

```
viewer/

    parser/
        fitParser.ts
        gpxParser.ts
        tcxParser.ts

    transform/
        wgs84.ts
        ecef.ts
        enu.ts

    geometry/
        trajectoryBuilder.ts
        colorBuilder.ts
        markerBuilder.ts

    viewer/
        scene.ts
        camera.ts
        renderer.ts
        controls.ts

    animation/
        flyover.ts

    ui/
        toolbar.ts

```

---

# 4. Standard Track Model

所有 Parser 最终输出统一数据结构：

```typescript
interface TrackPoint {

    lat:number

    lng:number

    altitude:number

    timestamp:number

    speed?:number

    heartRate?:number

    cadence?:number

}

interface Track {

    points:TrackPoint[]

}
```

禁止 Parser 输出 Three.js 对象。

Parser 只负责解析。

---

# 5. Coordinate Transform

禁止直接使用经纬度作为 Three.js 坐标。

必须：

```
WGS84

↓

ECEF

↓

ENU(Local)

↓

Three.js
```

坐标映射：

```
East

↓

Three.x

North

↓

Three.z

Up

↓

Three.y
```

最终：

```
Vector3(

    east,

    up,

    north

)
```

---

# 6. Vertical Exaggeration

默认：

```
Altitude Scale = 3
```

可配置：

```
1x

2x

3x

5x

10x
```

实现：

```
up *= altitudeScale
```

UI 必须支持实时调整。

Geometry 自动更新。

---

# 7. Geometry Builder

输入：

```
Track
```

输出：

```
BufferGeometry
```

要求：

使用

```
BufferGeometry
```

禁止：

```
Geometry
```

因为已废弃。

Position：

```
Float32Array
```

一次性写入。

禁止：

```
new Vector3()

push()

频繁创建对象
```

---

# 8. Line Material

默认：

```
Line2

(LineSegments2)
```

不要：

```
LineBasicMaterial
```

原因：

浏览器线宽限制。

必须支持：

```
width

opacity

color

```

---

# 9. Color Mode

支持：

```
Single Color

Altitude

Speed

Heart Rate

Cadence

Gradient
```

颜色计算：

```
Track

↓

ColorBuilder

↓

Float32 Color Buffer

↓

Geometry Attribute
```

不得运行时每帧计算颜色。

---

# 10. Scene

Scene 包含：

```
Trajectory

Grid

Axis

Start Marker

End Marker

```

默认：

```
GridHelper

AxesHelper
```

---

# 11. Camera

默认：

```
PerspectiveCamera
```

FOV：

```
45°
```

Near：

```
0.1
```

Far：

```
100000
```

加载轨迹后：

自动：

```
Fit To Bounding Box
```

禁止固定 Camera。

---

# 12. Orbit Controls

默认：

```
OrbitControls
```

开启：

```
Damping

Rotate

Zoom

Pan

```

默认：

```
AutoRotate

false
```

可开启：

```
true
```

---

# 13. Auto Rotate

围绕：

```
Bounding Box Center
```

旋转。

速度：

```
0~10
```

支持：

```
Play

Pause
```

---

# 14. Bounding Box

加载 Geometry 后：

计算：

```
Box3
```

得到：

```
Center

Size

Radius
```

用于：

```
Camera

Rotate Center

Flyover

```

---

# 15. Start End Marker

自动生成：

```
Start

Sphere

Green
```

```
End

Sphere

Red
```

Marker 大小：

```
根据 Camera Distance

自动缩放
```

避免缩放后过小。

---

# 16. Flyover

输入：

```
Track
```

生成：

```
CatmullRomCurve3
```

相机：

```
position

=

curve.getPointAt(t)
```

LookAt：

```
curve.getPointAt(t+0.01)
```

支持：

```
Play

Pause

Replay

Speed
```

---

# 17. Performance

目标：

```
100000 points

60 FPS
```

要求：

Geometry：

```
BufferGeometry
```

Color：

```
Float32Array
```

Position：

```
Float32Array
```

一次上传 GPU。

禁止：

```
每帧：

new Vector3()

setFromPoints()

重新创建 Geometry
```

---

# 18. UI

Toolbar：

```
Altitude Scale

Color Mode

Auto Rotate

Flyover

Reset Camera

Screenshot
```

---

# 19. API

```
loadTrack(track)

setAltitudeScale(scale)

setColorMode(mode)

playFlyover()

pauseFlyover()

fitCamera()

resetCamera()

toggleAutoRotate()

takeScreenshot()

dispose()
```

---

# 20. Future Extension

支持：

```
DEM Terrain

Heat Map

Split Segment

Waypoint

Photo

Checkpoint

Elevation Profile

Multiple Tracks

Realtime Track

Replay

VR

AR
```

---

# 21. 推荐技术栈

| 模块     | 推荐                                         |
| ------ | ------------------------------------------ |
| 3D 引擎  | Three.js                                   |
| 相机控制   | OrbitControls                              |
| 粗线渲染   | Line2（examples 中的宽线实现）                     |
| 坐标转换   | 自实现 WGS84 → ECEF → ENU，或使用成熟地理坐标库          |
| FIT 解析 | `fit-file-parser` 或其他 FIT 解析库              |
| GPX 解析 | XML Parser                                 |
| 状态管理   | Zustand（React）或 Pinia（Vue）均可               |
| UI     | React + TypeScript（推荐）或 Vue 3 + TypeScript |

---

## v2 版本建议（产品级）

如果你的目标是做一个类似 Garmin Connect、Strava 的专业轨迹平台，我建议把 Viewer 拆成一个**可复用的 SDK**，而不是页面组件。

例如：

```text
packages/
├── trajectory-core          // 数据模型、坐标转换
├── trajectory-parser        // FIT/GPX/TCX 解析
├── trajectory-renderer      // Three.js 渲染核心
├── trajectory-ui            // Toolbar、控制面板
├── trajectory-react         // React 封装
├── trajectory-vue           // Vue 封装
└── demo                     // 示例应用
```

这样后续无论是 Web、Electron，还是你的运动平台管理后台，都可以直接复用同一套渲染能力。随着需求增加（多轨迹对比、照片时间轴、实时轨迹、DEM 地形、Flyover、轨迹分析等），也不会因为架构耦合而需要大规模重构。
