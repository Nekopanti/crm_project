import uuid
from django.test import TransactionTestCase
from account.models import (
    Object,
    PageLayout,
    PageList,
    ObjectField,
    PageLayoutField,
    PageListField,
    Account,
)


class TestDataGeneration(TransactionTestCase):
    def setUp(self):
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

        # 创建 Account 数据
        self.account1 = Account.objects.create(
            object=self.object1,  # 关联到之前创建的 Object
            data={
                "account_name": "Dr. Test",
                "hospital": "test Hospital",
                "department": "xxxxxtest",
                "phone": "1234567890",
            },
        )

    def test_object_count(self):
        # 检查 Object 表中是否有 1 条数据
        self.assertEqual(Object.objects.count(), 1)

    def test_pagelist_count(self):
        # 检查 PageList 表中是否有 1 条数据
        self.assertEqual(PageList.objects.count(), 1)

    def test_pagelayout_count(self):
        # 检查 PageLayout 表中是否有 1 条数据
        self.assertEqual(PageLayout.objects.count(), 1)

    def test_objectfield_count(self):
        # 检查 ObjectField 表中是否有 4 条数据
        self.assertEqual(ObjectField.objects.count(), 4)

    def test_pagelayoutfield_count(self):
        # 检查 PageLayoutField 表中是否有 3 条数据
        self.assertEqual(PageLayoutField.objects.count(), 3)

    def test_pagelistfield_count(self):
        # 检查 PageListField 表中是否有 3 条数据
        self.assertEqual(PageListField.objects.count(), 3)

    def test_account_count(self):
        # 检查 Account 表中是否有 3 条数据
        self.assertEqual(Account.objects.count(), 1)
