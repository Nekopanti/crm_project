# 使用官方 Python 基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装依赖
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# 复制项目代码
COPY . /app/

# 暴露端口
EXPOSE 8000

# 运行数据库迁移并启动 gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
