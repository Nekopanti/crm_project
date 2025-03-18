import os
import sys
import django
from django.db import connection

# 获取当前文件的目录路径
current_dir = os.path.dirname(os.path.abspath(__file__))
# 获取根目录路径
project_root = os.path.abspath(os.path.join(current_dir, ".."))
# 将根目录路径添加到 sys.path
if project_root not in sys.path:
    sys.path.append(project_root)
# 初始化 Django 环境
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


def execute_sql(sql):
    with connection.cursor() as cursor:
        cursor.execute(sql)


def drop_tables():
    try:
        # 关闭外键约束检查
        execute_sql("SET FOREIGN_KEY_CHECKS = 0;")

        # 删除表
        tables_to_drop = [
            "django_migrations",
            "django_content_type",
            "django_admin_log",
            "auth_user_user_permissions",
            "auth_user_groups",
            "auth_user",
            "auth_permission",
            "auth_group_permissions",
            "auth_group",
            "django_session",
            "objects",
            "page_layouts",
            "page_lists",
            "object_fields",
            "page_layout_fields",
            "page_list_fields",
            "t_account",
        ]

        for table in tables_to_drop:
            execute_sql(f"DROP TABLE IF EXISTS {table};")

        # 开启外键约束检查
        execute_sql("SET FOREIGN_KEY_CHECKS = 1;")

        print("数据删除成功")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    drop_tables()
