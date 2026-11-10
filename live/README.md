# fopusha 竖屏诵经直播

把网站上已有的诵经、唱诵视频做成 9:16 竖屏，在 VPS 上 24 小时循环推到 YouTube 直播。每场 11.5 小时后自动结束，停 3 分钟再开新的一场（超过 12 小时的直播不计入 YPP 时长）。断网会自动重连。

画面：上面是经名，中间是原视频（带逐字字幕），下面是「经文全文带拼音」和对应经页的网址，例如 `fopusha.com/jing/dabeizhou`。

## 一、准备

1. **VPS**：Ubuntu 22.04 或 24.04，1 核 1G 就够，能连 YouTube 就行。推流不重新编码，CPU 占用很低。
   流量：一路直播大约 1.9 Mbps，24 小时约 20 GB，一个月约 600 GB。按 VPS 每月流量额度决定开几路。
2. **YouTube 频道**：用你自己的频道。一个频道开一路直播（一部经），想开几部经就准备几个频道。
   - 频道要先完成手机验证（YouTube Studio → 设置 → 频道 → 功能使用资格 → 中级功能）。
   - 第一次开直播要等 24 小时才会开通。

## 二、在 VPS 上安装

```bash
git clone https://github.com/davard123/baifo.git
cd baifo/live
sudo ./install.sh
```

## 三、生成竖屏素材

```bash
cd /opt/fopusha-live
./prepare.sh dabeizhou     # 只做大悲咒
./prepare.sh all           # 七部经全部做（单核 VPS 上要几个小时，可以挂在 screen 或 tmux 里跑）
```

可选名称：`dabeizhou` `xinjing` `dizang` `amituo` `pumen` `puxian` `jingang`，每一路用哪些视频写在 `streams.conf` 里。网站上更新了视频后，删掉 `/opt/fopusha-live/work/<名称>` 和 `/opt/fopusha-live/cache` 再运行一次即可。

## 四、YouTube Studio 设置（每个频道做一次）

1. YouTube Studio 右上角「创建」→「开始直播」→ 左侧选「直播」（不是「排定的直播」）。
2. 「直播设置」：
   - 推流密钥：选「默认推流密钥」，点「复制」。
   - **打开「自动开始」和「自动结束」**。这样每场结束后再推流会自动开新的一场。
   - 直播延迟：普通延迟即可。
3. 「修改」直播信息：标题、说明、公开、「否，不是面向儿童的内容」。标题和说明可以用下面第六部分的现成文案。

## 五、开播

```bash
echo 'STREAM_KEY=粘贴你的推流密钥' > /etc/fopusha-live/dabeizhou.env
chmod 600 /etc/fopusha-live/dabeizhou.env
systemctl enable --now fopusha-live@dabeizhou      # 开播，并且开机自动启动
journalctl -u fopusha-live@dabeizhou -f            # 看日志，Ctrl+C 退出
systemctl stop fopusha-live@dabeizhou              # 停播
```

几十秒后 YouTube Studio 里应该能看到画面，「自动开始」会让它直接上线。

**第一次轮换要看一下**：开播 11.5 小时后，日志会显示「本场到时」，3 分钟后开新一场。到时去 YouTube Studio 确认上一场已经结束、新的一场已经自动开始。如果新的一场没有自动开，告诉我，可以改成用 YouTube API 每场自动建一场直播。

可选设置，写在同一个 env 文件里：

```
SESSION_HOURS=11.5   # 每场时长，最多 11.9
GAP_SECONDS=180      # 两场之间停多久
PLAYLIST="dabeizhou_sing xinjing_music amituo_sing pumen_sing puxian_sing jingang_sing dizang_sing"
                     # 多部经轮流播放，每场开始时随机打乱顺序，避免同一段内容一天循环几百遍；
                     # 还没生成好的素材会自动跳过，生成好以后下一场自动加进来
```

改完 env 文件后 `systemctl restart fopusha-live@<名称>` 生效（会结束当前这一场，3 分钟内开新的一场）。

## 六、标题和说明文案（可直接复制）

标题里同时写中文和英文，海外华人和外国人都能搜到。

| 名称 | 标题 |
|---|---|
| dabeizhou | 大悲咒 24小时 女声读诵·唱诵 循环播放 可跟读｜Great Compassion Mantra 24/7 |
| xinjing | 心经 24小时 读诵·唱诵 循环播放 可跟读｜Heart Sutra Chanting 24/7 |
| dizang | 地藏经 全经十三品 女声读诵 24小时循环｜Ksitigarbha Sutra 24/7 |
| amituo | 阿弥陀经 唱诵·读诵 24小时循环｜Amitabha Sutra Chanting 24/7 |
| pumen | 观世音菩萨普门品 唱诵·读诵 24小时循环｜Universal Gate Chapter 24/7 |
| puxian | 普贤行愿品 唱诵全文 24小时循环｜Samantabhadra Vows Chanting 24/7 |
| jingang | 金刚经 唱诵·女声读诵全经 24小时循环｜Diamond Sutra 24/7 |

说明模板（把经名和网址换成对应的）：

```
大悲咒女声读诵与唱诵，24 小时循环播放，字幕逐字变色，可以跟着念。

📖 经文全文带拼音、可跟读：https://fopusha.com/jing/dabeizhou/
🙏 免费在线礼佛、拜财神、网上祭祖：https://fopusha.com/

画面和唱诵由 AI 辅助制作，经文按汉传通行课诵本校订。
#大悲咒 #佛经 #诵经 #观世音菩萨 #GreatCompassionMantra #Buddhism
```

## 注意

- 只用自己做的视频和配乐，不要放任何第三方音乐，否则会收到社区准则警告，那一场也不计时长。
- 用自己的频道，不要买号、不要用一次性接码注册，被封通常是一批号一起封。
- 同一段素材一直循环，申请 YPP 审核时有可能被判为「重复内容」。多做几版素材轮换会更稳。

## 七、每场自动建直播（YouTube API，推荐）

用「默认推流密钥」直接推流时，第一场会自动开播，但**一场结束后 YouTube 不会自动开下一场**，要在 Studio 里再点一次「直播」。授权 YouTube API 后，每场开始前脚本会自己建一场公开直播（自动开始、自动结束），绑定到同一个推流密钥，就完全不用人管了。

一次性设置（约 10 分钟，用直播频道所在的 Google 账号）：

1. 打开 https://console.cloud.google.com/ ，新建一个项目（名字随意，例如 fopusha-live）。
2. 「API 和服务」→「库」，搜索 **YouTube Data API v3**，点「启用」。
3. 「OAuth 同意屏幕」：用户类型选「外部」，填应用名和邮箱，保存；然后在「发布状态」点 **「发布应用」** 改成「正式版」。不发布的话授权 7 天就失效。（会显示「未经验证的应用」，自己用没关系。）
4. 「凭据」→「创建凭据」→「OAuth 客户端 ID」，应用类型选 **「电视和输入受限设备」**，创建后记下客户端 ID 和客户端密钥。
5. 在服务器上运行，按提示输入客户端 ID 和密钥，再用手机打开它给的网址、输入验证码、允许：
   ```bash
   sudo python3 /opt/fopusha-live/yt_api.py auth
   ```
6. 写标题和说明（每路一份）：
   ```bash
   sudo nano /etc/fopusha-live/dabeizhou.title   # 第一行是标题，最多 100 字
   sudo nano /etc/fopusha-live/dabeizhou.desc    # 直播说明
   ```
7. 重启服务：`sudo systemctl restart fopusha-live@dabeizhou`。日志里出现「已在 YouTube 建好新一场：https://www.youtube.com/watch?v=…」就成功了。

每建一场约用 100 点 API 配额，每天免费 10,000 点，一天两场绰绰有余。

### 每场自动发聊天欢迎留言

写一个 `/etc/fopusha-live/<名称>.chat`，每行一条（每条最多 200 字）。每场通过 API 建好并开播后，脚本会把这些留言发到直播聊天室。YouTube API 不支持置顶，需要置顶的话在 Studio 里手动点。

手动给正在播的一场补发：`sudo python3 /opt/fopusha-live/yt_api.py chat <名称> <直播的 watch?v= 后面那串>`

## 八、按时段换标题、聊天室回向（2026-11-09 新增，都是可选的）

后台数据显示直播几乎带不来新观众（28 天 11 人），而且每场标题一模一样。这两项是为了让直播间看起来有人在、有回应。

### 按时段换标题

写一个 `/etc/fopusha-live/<名称>.titles`，每行「开始小时-结束小时|标题」，按开播时的当地钟点挑一条。时区默认美西，可在 env 里用 `TITLE_TZ=Asia/Shanghai` 之类改掉。

```
04-11|早课诵经直播｜心经 大悲咒 普门品 唱诵 可跟读｜Morning Buddhist Chanting Live
11-18|午间诵经直播｜金刚经 阿弥陀经 地藏经 唱诵｜Buddhist Chanting Live
18-04|晚课 · 静心助眠诵经直播｜大悲咒 心经 唱诵｜Evening Buddhist Chanting Live
```

没有这个文件，或钟点不在任何一行里，就照旧用 `<名称>.title`。

### 聊天室回向

在 `/etc/fopusha-live/<名称>.env` 里加一行 `BLESS=1`，下一场开始生效。之后观众在聊天室留言，脚本每隔几分钟把这段时间留言的人合成一条回向发回聊天室，例如：

> 愿以此功德，回向王小明、Amy Chen：平安吉祥，所求如愿。🙏

- `BLESS_POLL=180`：多久读一次聊天室（秒，最少 60）。
- `BLESS_MAX=20`：每场最多回几条。
- 频道自己发的留言不算；一次最多列 8 个名字，更多的写「等 N 位」。
- 建议同时在 `<名称>.chat` 里加一条欢迎语，告诉观众可以这么做，例如：`在聊天里写下想为谁祈福，每隔几分钟会为大家一起回向 🙏`

**注意 API 配额**：读聊天室和发留言都要用 YouTube API 配额（每天免费 10,000 点）。开启后第一天请到 Google Cloud Console →「API 和服务」→「配额」看实际用量；如果接近上限，把 `BLESS_POLL` 调大、`BLESS_MAX` 调小。

名字不会印到直播画面上：画面是预先做好直接推送的，不重新编码。要印到画面上得改成实时编码，1 核的服务器带不动。

手动试一次：`sudo python3 /opt/fopusha-live/yt_api.py bless <名称> <直播的 watch?v= 后面那串> 600`

## 九、按钟点换场 + 开场共修（2026-11-09 新增）

在 env 里加：

```
SESSION_STARTS="06:00 18:00"   # 每天几点开新一场（共修时间），空格分隔
SESSION_TZ=America/Los_Angeles # 上面钟点的时区，默认美西（夏令时自动跟着变）
END_EARLY_MIN=10               # 每场提前几分钟收，留给 YouTube 结束上一场；6:00 开的那场 17:50 结束
OPENING=xinjing_music          # 每场开场先连播的素材
OPENING_REPEAT=7               # 连播几遍，再进入 PLAYLIST 随机轮播
```

- 设了 `SESSION_STARTS` 就不再按 `SESSION_HOURS` 计时，换场永远对齐钟点，不会每天往前漂。一场最长 11 小时 55 分。
- 服务在空档里（离钟点不到 END_EARLY_MIN + 5 分钟）启动，会先等到钟点再开播；在场次中间启动，就开一场到下一个钟点前结束的短场。
- 服务重启接着上一场时不重复开场共修，直接进轮播。
- 标题配合 `<名称>.titles` 按开播钟点挑（见第八节），例如：

```
00-12|每日6点共修·心经｜美西早6点 北京晚10点｜24小时佛经唱诵｜Buddhist Chanting Live
12-24|每日6点共修·心经｜美西晚6点 北京早10点｜24小时佛经唱诵｜Buddhist Chanting Live
```

注意：北京时间写在标题里是死的，美国夏令时（3 月到 11 月）期间要改成北京晚 9 点、早 9 点。
