import uuid
from django.db import models


class Object(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, null=True, blank=True)
    table_name = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "objects"


class ObjectField(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    object = models.ForeignKey(Object, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "object_fields"


class PageList(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "page_lists"


class PageListField(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    object_field = models.ForeignKey(ObjectField, on_delete=models.CASCADE)
    page_list = models.ForeignKey(PageList, on_delete=models.CASCADE)
    hidden = models.CharField(max_length=1, default="0", db_default="0")
    type = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "page_list_fields"


class PageLayout(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    page_list = models.ForeignKey(PageList, on_delete=models.CASCADE)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "page_layouts"


class PageLayoutField(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, null=True, blank=True)
    page_layout = models.ForeignKey(PageLayout, on_delete=models.CASCADE)
    object_field = models.ForeignKey(ObjectField, on_delete=models.CASCADE)
    type = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "page_layout_fields"


class Account(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    object = models.ForeignKey(Object, on_delete=models.CASCADE)
    # 动态数据存储：业务数据以 JSON 格式存储
    data = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    class Meta:
        db_table = "t_account"
        indexes = [
            models.Index(fields=["object"]),
        ]

    def __str__(self):
        return f"{self.object.name} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
