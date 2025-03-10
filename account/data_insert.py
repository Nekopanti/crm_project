import os
import sys
import django
import uuid

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


from django.db import transaction
from account.models import (
    Object,
    PageLayout,
    PageList,
    ObjectField,
    PageLayoutField,
    PageListField,
)


class DataInsert:
    def insert_data(self):
        try:
            with transaction.atomic():
                # 创建 Object 数据
                self.object1 = Object.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="account",
                    label="医生",
                    table_name="t_accounts",
                    deleted="0",
                )

                # 创建 PageList 数据
                self.page_list1 = PageList.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="account_list",
                    label="我的医生列表",
                    deleted="0",
                )

                # 创建 PageLayout 数据
                self.page_layout1 = PageLayout.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="我的医生详情",
                    page_list=self.page_list1,
                    deleted="0",
                )

                # 创建 ObjectField 数据
                self.object_field1 = ObjectField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="account_name",
                    type="text",
                    deleted="0",
                    object=self.object1,
                )
                self.object_field2 = ObjectField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="hospital",
                    type="text",
                    deleted="0",
                    object=self.object1,
                )
                self.object_field3 = ObjectField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="department",
                    type="text",
                    deleted="0",
                    object=self.object1,
                )
                self.object_field4 = ObjectField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="phone",
                    type="text",
                    deleted="0",
                    object=self.object1,
                )

                # 创建 PageLayoutField 数据
                self.page_layout_field1 = PageLayoutField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="医生姓名",
                    label="Label1",
                    type="text",
                    deleted="0",
                    object_field=self.object_field1,
                    page_layout=self.page_layout1,
                )
                self.page_layout_field2 = PageLayoutField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="医院",
                    label="Label2",
                    type="text",
                    deleted="0",
                    object_field=self.object_field2,
                    page_layout=self.page_layout1,
                )
                self.page_layout_field3 = PageLayoutField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="科室",
                    label="Label3",
                    type="text",
                    deleted="0",
                    object_field=self.object_field3,
                    page_layout=self.page_layout1,
                )

                # 创建 PageListField 数据
                self.page_list_field1 = PageListField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="account_name",
                    hidden="0",
                    type="text",
                    deleted="0",
                    object_field=self.object_field1,
                    page_list=self.page_list1,
                )
                self.page_list_field2 = PageListField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="hospital",
                    hidden="0",
                    type="text",
                    deleted="0",
                    object_field=self.object_field2,
                    page_list=self.page_list1,
                )
                self.page_list_field3 = PageListField.objects.create(
                    id=str(uuid.uuid4())[:32],
                    name="department",
                    hidden="0",
                    type="text",
                    deleted="0",
                    object_field=self.object_field3,
                    page_list=self.page_list1,
                )
            print("数据插入成功")
        except Exception as e:
            print(f"Transfer failed: {e}")


if __name__ == "__main__":
    data_insert = DataInsert()
    data_insert.insert_data()
