# 我们的厨房 🍳

两个人的小厨房：**在家点菜 · 想吃清单 · 吃饭记账**。

一个面向手机的 PWA，两个人用邀请码加入同一个「小家」，数据实时同步——你在这边点了一道菜，对方手机上马上就能看到。

## 功能

### 🍳 点菜
- **家常菜库**：自己维护会做的菜，每道菜可选 emoji、填参考成本
- **今日菜单**：点一下菜就加入今日菜单，显示是谁点的；做好一道可以打勾
- **这顿吃完啦**：一键把今日菜单记成一笔「在家做」的账，并清空菜单

### 💭 想吃
- **想吃清单**：记下想吃的外卖 / 想去的店，可填店名、理由、大概花费
- **🎲 今天吃啥**：从清单里随机挑一个，治好选择困难
- **吃了一次**：填上这次实际花了多少，自动记入「吃过」和账本，清单里的这条保留，下次还能再吃
- **吃过**：历史记录，可以打 1–5 星，点「想再吃」放回清单

### 💰 记账
- 本月吃饭总花费，按 **在家做 / 点外卖 / 出去吃** 分类汇总
- 按日期分组的明细，每笔显示是谁记的

### 其他
- 邮箱注册 / 登录
- 创建小家生成邀请码，对方输入邀请码加入
- 个人资料：名字、头像上传
- 货币切换：AUD / USD / CNY / EUR（保存在本机）
- 支持「添加到主屏幕」，像 App 一样全屏使用

## 技术栈

| 部分 | 选型 |
| --- | --- |
| 前端 | React 18 + Vite 6 |
| 样式 | Tailwind CSS 4 |
| 后端 | Supabase（Auth、Postgres、Realtime、Storage） |
| 部署 | Vercel（或任意静态托管） |

## 本地运行

需要 Node.js 18+。

```bash
npm install
npm run dev
```

`dev` 带了 `--host`，同一局域网下可以直接用手机打开终端里显示的地址调试。

打包：

```bash
npm run build
npm run preview
```

## 后端配置

Supabase 的连接信息在 [`src/supabase.js`](src/supabase.js)。这里用的是 publishable key，本来就是前端公开值，数据安全靠数据库的 RLS（行级安全）策略保证。

如果要接自己的 Supabase 项目，把 `SUPABASE_URL` 和 `SUPABASE_KEY` 换成你的，并在数据库里准备以下内容：

**数据表**（除 `households` 外都带 `household_id`，用来区分不同的小家）

| 表 | 用途 | 主要字段 |
| --- | --- | --- |
| `households` | 小家 | `id`, `invite_code` |
| `profiles` | 成员资料 | `id`（= auth 用户 id）, `household_id`, `display_name`, `avatar_url` |
| `dishes` | 家常菜库 | `name`, `emoji`, `category`, `cost`, `created_by` |
| `today_items` | 今日菜单 | `dish_id`, `ordered_by`, `done` |
| `wishes` | 想吃 / 吃过 | `name`, `shop`, `type`, `reason`, `price`, `rating`, `eaten`, `created_by` |
| `ledger` | 账本 | `date`, `type`, `title`, `amount`, `created_by` |

`type` 取值：`home`（在家做）、`takeout`（点外卖）、`dineout`（出去吃）。

**RPC 函数**
- `create_home(p_display_name, p_avatar)`：创建小家、生成邀请码，并写入当前用户的 profile
- `join_home(p_code, p_display_name, p_avatar)`：用邀请码加入已有小家

**其他**
- Storage 建一个公开的 `avatars` bucket，用来存头像
- 对上面几张表开启 Realtime，实时同步才会生效
- RLS 策略：用户只能读写自己所在 `household_id` 的数据

## 目录结构

```
src/
├── App.jsx            # 登录态判断、顶栏、底部 Tab
├── Auth.jsx           # 登录 / 注册
├── Onboarding.jsx     # 首次进入：建档案、创建或加入小家
├── ProfileSheet.jsx   # 我的资料、邀请码、货币
├── useCloud.js        # 数据层：加载、实时订阅、增删改
├── supabase.js        # Supabase 客户端
├── components/
│   └── Avatar.jsx
└── tabs/
    ├── Cook.jsx       # 点菜
    ├── Wishes.jsx     # 想吃
    └── Ledger.jsx     # 记账
public/
├── icon.svg
└── manifest.webmanifest
```
