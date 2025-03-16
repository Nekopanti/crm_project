from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
from django.db import transaction
from .models import (
    Object,
    ObjectField,
    PageList,
    PageListField,
    PageLayout,
    PageLayoutField,
)
from .serializers import (
    ObjectSerializer,
    ObjectFieldSerializer,
    PageListSerializer,
    PageListFieldSerializer,
    PageLayoutSerializer,
    PageLayoutFieldSerializer,
)


# 自定义分页
class AccountPagination(PageNumberPagination):
    page_size = 20  # 每页显示 20 条数据
    page_size_query_param = "page_size"
    max_page_size = 100


class AccountViewSet(ModelViewSet):
    queryset = PageList.objects.all()
    serializer_class = PageListSerializer  # 主要序列化器
    pagination_class = AccountPagination  # 启用分页
    filter_backends = [SearchFilter, OrderingFilter]  # 支持搜索 & 排序
    search_fields = ["^name"]  # 允许通过name首字母搜索
    ordering_fields = ["id", "name"]  # 允许排序字段
    ordering = ["name"]  # 默认按 name 排序

    def retrieve(self, request, pk=None):
        """获取某个账户详情（PageList + PageListField + PageLayout + PageLayoutField）"""
        try:
            page_list = PageList.objects.get(id=pk)
            serialized_page_list = PageListSerializer(page_list).data

            # 获取与 PageList 关联的 PageListField
            page_list_fields = PageListField.objects.filter(page_list=page_list)
            serialized_page_list_fields = PageListFieldSerializer(
                page_list_fields, many=True
            ).data

            # 获取与 PageList 关联的 PageLayout 和 PageLayoutField
            page_layouts = PageLayout.objects.filter(page_list=page_list)
            serialized_page_layouts = PageLayoutSerializer(page_layouts, many=True).data

            page_layout_fields = PageLayoutField.objects.filter(
                page_layout__in=page_layouts
            )
            serialized_page_layout_fields = PageLayoutFieldSerializer(
                page_layout_fields, many=True
            ).data

            # 获取与 PageListField 关联的 ObjectField 和 Object
            object_fields = ObjectField.objects.filter(
                id__in=page_list_fields.values("object_field")
            )
            serialized_object_fields = ObjectFieldSerializer(
                object_fields, many=True
            ).data

            objects = Object.objects.filter(id__in=object_fields.values("object"))
            serialized_objects = ObjectSerializer(objects, many=True).data

            return Response(
                {
                    "page_list": serialized_page_list,
                    "page_list_fields": serialized_page_list_fields,
                    "page_layout": serialized_page_layouts,
                    "page_layout_fields": serialized_page_layout_fields,
                    "object": serialized_objects,
                    "object_fields": serialized_object_fields,
                }
            )
        except PageList.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """创建账户（Object + ObjectField + PageList + PageListField + PageLayout + PageLayoutField）"""
        try:
            with transaction.atomic():  # 保证数据一致性
                # 创建 Object
                object_data = request.data.get("object", [])
                object_serializer = ObjectSerializer(data=object_data, many=True)
                if object_serializer.is_valid():
                    object_instance = object_serializer.save()
                else:
                    raise ValidationError(object_serializer.errors)
                # 创建 PageList
                page_list_data = request.data.get("page_list", {})
                page_list_serializer = PageListSerializer(data=page_list_data)
                if page_list_serializer.is_valid():
                    page_list = page_list_serializer.save()
                else:
                    raise ValidationError(page_list_serializer.errors)

                # 创建 PageLayout
                page_layout_data = request.data.get("page_layout", [])
                page_layout_data[0]["page_list"] = page_list.id
                page_layout_serializer = PageLayoutSerializer(
                    data=page_layout_data, many=True
                )
                if page_layout_serializer.is_valid():
                    page_layout = page_layout_serializer.save()
                else:
                    raise ValidationError(page_layout_serializer.errors)
                # 创建 ObjectField
                object_fields_data = request.data.get("object_fields", [])
                for object_field_data in object_fields_data:
                    object_field_data["object"] = object_instance[0].id
                    object_field_serializer = ObjectFieldSerializer(
                        data=object_field_data
                    )
                    if object_field_serializer.is_valid():
                        object_field = object_field_serializer.save()
                    else:
                        raise ValidationError(object_field_serializer.errors)
                    # 创建 PageListField
                    fields_data = request.data.get("page_list_fields", [])
                    for field_data in fields_data:
                        field_data["page_list"] = page_list.id
                        field_data["object_field"] = object_field.id
                        page_list_field_serializer = PageListFieldSerializer(
                            data=field_data
                        )
                        if page_list_field_serializer.is_valid():
                            page_list_field_serializer.save()
                        else:
                            raise ValidationError(page_list_field_serializer.errors)
                    # 创建 PageLayoutField
                    page_layout_fields_data = request.data.get("page_layout_fields", [])
                    for layout_field_data in page_layout_fields_data:
                        layout_field_data["page_layout"] = page_layout[0].id
                        layout_field_data["object_field"] = object_field.id
                        page_layout_field_serializer = PageLayoutFieldSerializer(
                            data=layout_field_data
                        )
                        if page_layout_field_serializer.is_valid():
                            page_layout_field_serializer.save()
                        else:
                            raise ValidationError(page_layout_field_serializer.errors)

                return Response({"message": "创建成功"}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """更新账户（PageList + PageListField + ObjectField + Object + PageLayout + PageLayoutField）"""
        try:
            with transaction.atomic():  # 开启事务
                # 获取 PageList 实例
                page_list = PageList.objects.get(id=pk)

                # 更新 PageList
                page_list_data = request.data.get("page_list", {})
                page_list_serializer = PageListSerializer(
                    page_list, data=page_list_data, partial=True
                )
                if page_list_serializer.is_valid():
                    page_list_serializer.save()
                else:
                    raise ValidationError(page_list_serializer.errors)

                # 更新 PageListField
                page_list_fields_data = request.data.get("page_list_fields", [])
                for field_data in page_list_fields_data:
                    field_instance = PageListField.objects.get(id=field_data["id"])
                    field_serializer = PageListFieldSerializer(
                        field_instance, data=field_data, partial=True
                    )
                    if field_serializer.is_valid():
                        field_serializer.save()
                    else:
                        raise ValidationError(field_serializer.errors)

                # 批量更新 ObjectField 和 Object（数组）
                object_fields_data = request.data.get("object_fields", [])
                for object_field_data in object_fields_data:
                    object_field_instance = ObjectField.objects.get(
                        id=object_field_data["id"]
                    )
                    object_field_serializer = ObjectFieldSerializer(
                        object_field_instance, data=object_field_data, partial=True
                    )
                    if object_field_serializer.is_valid():
                        object_field_serializer.save()
                    else:
                        raise ValidationError(object_field_serializer.errors)

                # **处理 Object 数组**
                object_list = request.data.get("object", [])
                for object_data in object_list:  # 遍历 Object 数组
                    object_instance = Object.objects.get(id=object_data["id"])
                    object_serializer = ObjectSerializer(
                        object_instance, data=object_data, partial=True
                    )
                    if object_serializer.is_valid():
                        object_serializer.save()
                    else:
                        raise ValidationError(object_serializer.errors)

                # **处理 PageLayout 数组**
                page_layouts_data = request.data.get("page_layout", [])
                for page_layout_data in page_layouts_data:
                    page_layout_instance = PageLayout.objects.get(
                        id=page_layout_data["id"]
                    )
                    page_layout_serializer = PageLayoutSerializer(
                        page_layout_instance, data=page_layout_data, partial=True
                    )
                    if page_layout_serializer.is_valid():
                        page_layout_serializer.save()
                    else:
                        raise ValidationError(page_layout_serializer.errors)

                # **处理 PageLayoutField 数组**
                page_layout_fields_data = request.data.get("page_layout_fields", [])
                for field_data in page_layout_fields_data:
                    page_layout_field_instance = PageLayoutField.objects.get(
                        id=field_data["id"]
                    )
                    page_layout_field_serializer = PageLayoutFieldSerializer(
                        page_layout_field_instance,
                        data=field_data,
                        partial=True,
                    )
                    if page_layout_field_serializer.is_valid():
                        page_layout_field_serializer.save()
                    else:
                        raise ValidationError(page_layout_field_serializer.errors)

                return Response({"message": "更新成功"}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except PageList.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)
        except PageListField.DoesNotExist:
            return Response(
                {"error": "PageListField 不存在"}, status=status.HTTP_404_NOT_FOUND
            )
        except ObjectField.DoesNotExist:
            return Response(
                {"error": "ObjectField 不存在"}, status=status.HTTP_404_NOT_FOUND
            )
        except Object.DoesNotExist:
            return Response(
                {"error": "Object 不存在"}, status=status.HTTP_404_NOT_FOUND
            )
        except PageLayout.DoesNotExist:
            return Response(
                {"error": "PageLayout 不存在"}, status=status.HTTP_404_NOT_FOUND
            )
        except PageLayoutField.DoesNotExist:
            return Response(
                {"error": "PageLayoutField 不存在"}, status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, pk=None):
        """删除账户（PageList, PageLayout, Object 及相关字段）"""
        try:
            # 获取 PageList 实例
            page_list = PageList.objects.get(id=pk)

            with transaction.atomic():
                # 删除与 PageLayout 相关的字段
                page_layouts = PageLayout.objects.filter(page_list=page_list)
                PageLayoutField.objects.filter(page_layout__in=page_layouts).delete()
                page_layouts.delete()

                # 删除与 PageList 相关的字段
                page_list_fields = PageListField.objects.filter(page_list=page_list)
                for page_list_field in page_list_fields:
                    # 通过 PageListField 获取 ObjectField
                    object_field = page_list_field.object_field

                    # 删除 PageListField
                    page_list_field.delete()

                    # 删除 ObjectField
                    if not PageListField.objects.filter(
                        object_field=object_field
                    ).exists():
                        # 删除 ObjectField
                        object_field.delete()
                    # 删除 Object
                    if not ObjectField.objects.filter(
                        object=object_field.object
                    ).exists():
                        object_field.object.delete()

                # 删除 PageList
                page_list.delete()

                return Response(
                    {"message": "删除成功"}, status=status.HTTP_204_NO_CONTENT
                )
        except PageList.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)


class ObjectViewSet(ModelViewSet):
    queryset = Object.objects.all()
    serializer_class = ObjectSerializer


class ObjectFieldViewSet(ModelViewSet):
    queryset = ObjectField.objects.all()
    serializer_class = ObjectFieldSerializer


class PageListViewSet(ModelViewSet):
    queryset = PageList.objects.all()
    serializer_class = PageListSerializer


class PageListFieldViewSet(ModelViewSet):
    queryset = PageListField.objects.all()
    serializer_class = PageListFieldSerializer


class PageLayoutViewSet(ModelViewSet):
    queryset = PageLayout.objects.all()
    serializer_class = PageLayoutSerializer


class PageLayoutFieldViewSet(ModelViewSet):
    queryset = PageLayoutField.objects.all()
    serializer_class = PageLayoutFieldSerializer
