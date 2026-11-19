# StackFarm 软件创新实验室网站

双击 index.html 预览。首页及栏目编排参考 [Greene Lab Website Template](https://greenelab.github.io/lab-website-template/)，静态页面可直接打开。

网站内容存放在 content.js。项目用 id 标识，成员和动态通过 projects 数组关联项目。项目可用 image、imageAlt、body 填写封面路径、图片说明和详情。动态整理自实验室官方 QQ 空间备份，部分条目为摘要。

本地动态配图存放于 `assets/images/qzone/`，部署时需要一并上传。原始 `QQ空间备份/` 已被 Git 忽略，不上传其中的评论、点赞名单和原始导出文件。

需要重新整理同一格式的备份时，可运行 `python tools/import_qzone_media.py`（需要 Pillow、FFmpeg 和 FFprobe）。脚本按帖子发布时间匹配配图、去重并生成 WebP；只有确认仅一帧的 MP4 才转成静态图片，正常视频保留在原始备份中。导入记录写入备份目录的 `网站图片导入记录.json`。请在运行前备份手动编辑的内容文件。
