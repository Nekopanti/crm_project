# crm_project

## 项目概述

该项目是一个基于 Django 和 Vue 的账户管理系统，前端 Vue 项目集成到 Django 项目中。
前端页面存放在 Django 的 `static/` 文件夹中，Vue 构建后的静态文件（如 `app.js` 和 `index.html`）用于呈现用户界面。
后端使用 Django 提供 API，进行账户管理和数据交互。

## 技术栈

- **后端**: Django
- **前端**: Vue.js
- **数据库**: MySQL
- **IDE**: VScode

## 环境要求

- **Python 3.x**
- **Node.js** 和 **npm**
- **MySQL**

## 项目结构

```bash
crm_project/
├── config/          # Django 项目的核心文件夹
│   ├── __init__.py
│   ├── settings.py  # Django 设置
│   ├── urls.py      # URL 路由配置
│   ├── wsgi.py      # WSGI 配置
├── manage.py        # Django 项目的管理命令
├── account/         # 存放 Django API 相关代码
│   ├── __init__.py
│   ├── admin.py     # Django 管理后台
│   ├── apps.py      # 配置 Django 应用的信息
│   ├── views.py     # API 视图
│   ├── models.py    # 数据库模型
│   ├── serializers.py # API 序列化
│   ├── urls.py      # API 路由
│   ├── tests.py     # 测试表结构
│   ├── data_insert.py # 样例数据插入脚本
├── static/          # Django 静态文件夹（存放构建后的 Vue 文件）
├── templates/       # Django 模板文件夹（存放 Vue 构建后的 index.html）
├── frontend/        # Vue 前端
│   ├── dist/        # Vue 构建后的静态文件（包含 index.html 和 JS/CSS 文件）
│   ├── public/      # Vue 项目的公共文件
│   ├── src/         # Vue 项目的源代码
│   │   ├── assets/  # 图片、样式等静态资源
│   │   ├── components/  # Vue 组件
│   │   ├── views/   # Vue 页面视图
│   │   ├── App.vue  # Vue 的根组件
│   │   ├── main.js  # Vue 入口文件
│   ├── package.json # Vue 项目配置文件
│   ├── vue.config.js # Vue 的配置文件
├── sql/             # 表操作sql（弃用）
├── venv/            # Python 虚拟环境
├── .env             # Python 环境变量配置文件
├── requirements.txt # Python 依赖列表
└── README.md        # 项目的说明文档
```

## 安装与配置

### 1. 安装前端依赖

在 `frontend/` 目录中运行以下命令安装前端依赖：

```bash
cd frontend/
npm install
```

### 2. 安装后端依赖

在 `crm_project/` 根目录下运行以下命令安装后端依赖：

```bash
cd crm_project
pip install -r requirements.txt
```

### 3. 配置数据库

1. 创建一个新的 MySQL 数据库 crm_db
2. 在 .env 文件中配置数据库连接

```bash
SECRET_KEY=crm_project
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=crm_db
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
```

### 4. 运行数据库迁移

在 `crm_project/` 根目录下运行以下命令以应用数据库迁移

```bash
cd crm_project
python manage.py migrate
python manage.py makemigrations account
python manage.py migrate account
```

在 `crm_project/` 根目录下运行 data_insert.py 插入样例数据

### 5. 运行前端构建

构建 Vue 前端项目

```bash
cd frontend
npm run build
```

### 6. 启动 Django 项目

在 `crm_project/` 目录下启动 Django 开发服务器

```bash
cd crm_project
python manage.py runserver
```

### 7. 启动前端开发服务器

在 `frontend/` 目录下启动 Vue 开发服务器

```bash
cd frontend
npm run serve
```

## 后端路由

### 1. 获取账户列表

- **URL**: `/account/accounts/`
- **方法**: `GET`

### 2. 创建账户

- **URL**: `/account/accounts/`
- **方法**: `POST`

### 3. 获取单个账户信息

- **URL**: `/account/accounts/{id}/`
- **方法**: `GET`

### 4. 更新账户

- **URL**: `/account/accounts/{id}/`
- **方法**: `PUT`

### 5. 删除账户

- **URL**: `/account/accounts/{id}/`
- **方法**: `DELETE`

## 前端路由

### 1. 账户列表页面

- **路由路径**: `/accounts`
- **描述**: 显示所有账户信息，支持分页、排序、搜索功能。该页面的功能通过 `app.js` 中的 Vue 组件实现。

### 2. 创建账户页面

- **路由路径**: `/accounts/create`
- **描述**: 提供表单，允许用户创建新账户，字段有空值校验。该页面的功能通过 `app.js` 中的 Vue 组件实现。

### 3. 编辑账户页面

- **路由路径**: `/accounts/edit/:id`
- **描述**: 提供表单，允许用户编辑已有账户，字段有空值校验，不支持添加或删除字段。该页面的功能通过 `app.js` 中的 Vue 组件实现。

### 4. 账户详情页面

- **路由路径**: `/accounts/:id`
- **描述**: 显示某个账户的详细信息，可以查看账户的字段和相关数据。该页面的功能通过 `app.js` 中的 Vue 组件实现。

## 项目功能

- **账户管理**: 可以添加、编辑、删除账户记录。
- **分页功能**: 账户列表采用分页，每页显示 20 条记录。
- **排序功能**: 支持按账户名称排序。
- **搜索功能**: 支持按首字母搜索账户名。
- **表单校验**: 创建和编辑账户时，字段会进行空值校验。
