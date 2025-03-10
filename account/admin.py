from django.contrib import admin
from .models import (
    Object,
    ObjectField,
    PageList,
    PageListField,
    PageLayout,
    PageLayoutField,
)


@admin.register(Object)
class Object(admin.ModelAdmin):
    list_display = ("id", "name", "label", "table_name")


@admin.register(ObjectField)
class ObjectFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "object_id", "name", "type")


@admin.register(PageList)
class PageListAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "label")


@admin.register(PageListField)
class PageListFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "object_field_id", "page_list_id", "type")


@admin.register(PageLayout)
class PageLayoutAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "page_list_id")


@admin.register(PageLayoutField)
class PageLayoutFieldAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "label", "page_layout_id", "object_field_id", "type")
