要启用邮箱登录，需要在 Supabase Dashboard 开启 Email Auth。

## 操作步骤

### 1. 打开认证设置

访问 https://supabase.com/project/jmkdorwbcocynczrukyp/auth/providers

或者在项目 Dashboard 中：
1. 点击左侧 **「Authentication」**（锁形图标）
2. 点击 **「Providers」** 标签

### 2. 启用邮箱认证

找到 **「Email」** 这一行，确保开关是 **绿色开启状态**。

默认情况下：
- ✅ Email auth 是开启的
- ✅ 密码登录（Password）默认启用

### 3. 【重要】关闭邮箱确认（可选）

为了开发方便，可以关闭邮箱确认让用户直接登录：

1. 在 **「Authentication > Providers」** 页面
2. 点击 **「Email」** 进入设置
3. 找到 **「Confirm email」** 
4. **关闭** 这个开关
5. 点击 **「Save」**

⚠️ **注意**：生产环境建议开启邮箱确认。开发阶段关闭可以方便测试。

### 4. 验证是否生效

尝试访问 http://localhost:3000/login ，应该能看到登录页面。

---

## 验证登录流程

1. 打开 http://localhost:3000/login
2. 点击 **「注册」** 标签
3. 输入邮箱和密码注册
4. 注册成功后自动切换到登录页
5. 用刚才的邮箱密码登录
6. 登录后进入引导页，设置昵称和时区
7. 完成引导后进入今日页
