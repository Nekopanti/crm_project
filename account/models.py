import uuid
from django.db import models


# Create your models here.


class Object(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255, null=True, blank=True)
    table_name = models.CharField(max_length=255)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "objects"


class ObjectField(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    object = models.ForeignKey(Object, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
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
    type = models.CharField(max_length=255)
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
    type = models.CharField(max_length=255)
    deleted = models.CharField(max_length=1, default="0", db_default="0")

    def __str__(self):
        return self.name

    class Meta:
        db_table = "page_layout_fields"
