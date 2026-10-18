# V3 第一阶段：GLB 导入验证

## 导入结果

- 源文件：`public/models/Clos-Luce-Leonardo-Atelier.glb`
- SHA-256：`437e7e4e1087bc70a482f79c27b9b6edd82a53d8b987b9be1fc5ef0577e4b35e`
- 格式：glTF 2.0，生成器 `THREE.GLTFExporter r185`
- 实际运行时包围盒：`8.52 × 4.73 × 6.50`
- 运行时统计：1050 Mesh、50 Material、24 Texture 对象、1102 Node
- 根节点：`Clos_Luce_Atelier`

## 已验证命名节点

- `Architecture`
- `North_wall_with_two_leaded_windows`
- `Leaded_oak_window`
- `Timber_ceiling`
- `Limestone_fireplace`
- `Painting_corner`
- `Painting_tools`
- `Pigments_and_experimental_workbench`
- `Pigment_shelves`
- `Writing_and_anatomy_desk`
- `Research_shelves`
- `Renaissance_garment_mannequin`
- `Museum_rope_barriers`

## 材质扩展

模型声明了 `KHR_texture_transform`、`KHR_materials_emissive_strength` 与 `EXT_materials_bump`。前两项由当前 Three.js GLTFLoader 处理。`EXT_materials_bump` 为可选扩展，不在当前 GLTFLoader 的标准扩展列表中；基础 PBR 参数、UV 和内嵌纹理正常加载，但该扩展提供的额外 bump 效果本阶段尚未还原。

## 本阶段改动

- 新建 `app/studio-v3.tsx`，旧版 `app/studio.tsx` 原样保留作为回退版。
- 使用 GLTFLoader 导入 GLB，不渲染旧版程序化墙体、窗户、家具或天井。
- 保留白天、黄昏、夜晚、OrbitControls、自动漫游、重置和截图导出。
- 增加建筑全景、研究桌近景和绘画区近景预设。
- 为内嵌浏览器降低像素比并缩减实时投影批次，避免 1050 Mesh 在首帧引起 GPU 峰值崩溃。

## 本阶段未改动

- 未隐藏围栏、人台或家具。
- 未改造 `Timber_ceiling`。
- 未添加新天井、云雾或后处理。
- 未修改原始 GLB 文件。

## 截图

- `deliverables-v3-stage1/overview.png`
- `deliverables-v3-stage1/desk.png`
