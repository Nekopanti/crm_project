from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
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
    search_fields = ["name"]  # 允许通过 name 搜索
    ordering_fields = ["id", "name"]  # 允许排序字段
    ordering = ["id"]  # 默认按 id 排序

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

            return Response(
                {
                    "page_list": serialized_page_list,
                    "page_list_fields": serialized_page_list_fields,
                    "page_layouts": serialized_page_layouts,
                    "page_layout_fields": serialized_page_layout_fields,
                }
            )
        except PageList.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """创建账户（Object + ObjectField + PageList + PageListField + PageLayout + PageLayoutField）"""
        with transaction.atomic():  # 保证数据一致性
            # 创建 Object 和 ObjectField
            object_data = request.data.get("object", {})
            object_serializer = ObjectSerializer(data=object_data)
            if object_serializer.is_valid():
                object_instance = object_serializer.save()

                # 创建 ObjectField
                object_fields_data = request.data.get("object_fields", [])
                for object_field_data in object_fields_data:
                    object_field_data["object"] = object_instance.id
                    object_field_serializer = ObjectFieldSerializer(
                        data=object_field_data
                    )
                    if object_field_serializer.is_valid():
                        object_field = object_field_serializer.save()
                    else:
                        return Response(
                            object_field_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            else:
                return Response(
                    object_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

            # 创建 PageList 和 PageListField
            page_list_data = request.data.get("page_list", {})
            page_list_data["object"] = object_instance.id
            page_list_serializer = PageListSerializer(data=page_list_data)
            if page_list_serializer.is_valid():
                page_list = page_list_serializer.save()

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
                        return Response(
                            page_list_field_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            else:
                return Response(
                    page_list_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

            # 创建 PageLayout 和 PageLayoutField
            page_layout_data = request.data.get("page_layout", {})
            page_layout_data["page_list"] = page_list.id
            page_layout_serializer = PageLayoutSerializer(data=page_layout_data)
            if page_layout_serializer.is_valid():
                page_layout = page_layout_serializer.save()

                # 创建 PageLayoutField
                page_layout_fields_data = request.data.get("page_layout_fields", [])
                for layout_field_data in page_layout_fields_data:
                    layout_field_data["page_layout"] = page_layout.id
                    layout_field_data["object_field"] = object_field.id
                    page_layout_field_serializer = PageLayoutFieldSerializer(
                        data=layout_field_data
                    )
                    if page_layout_field_serializer.is_valid():
                        page_layout_field_serializer.save()
                    else:
                        return Response(
                            page_layout_field_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST,
                        )
            else:
                return Response(
                    page_layout_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

            return Response(page_list_serializer.data, status=status.HTTP_201_CREATED)

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
                    return Response(
                        page_list_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

                # 更新 PageListField
                page_list_fields = PageListField.objects.filter(page_list=page_list)
                page_list_fields_data = request.data.get("page_list_fields", [])
                for page_list_field, page_list_field_data in zip(
                    page_list_fields, page_list_fields_data
                ):
                    page_list_field_serializer = PageListFieldSerializer(
                        page_list_field, data=page_list_field_data, partial=True
                    )
                    if page_list_field_serializer.is_valid():
                        page_list_field_serializer.save()
                    else:
                        return Response(
                            page_list_field_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # 通过 PageListField 获取 ObjectField
                    object_field = page_list_field.object_field

                    # 更新 ObjectField
                    object_field_data = request.data.get("object_field", {})
                    if object_field_data:
                        object_field_serializer = ObjectFieldSerializer(
                            object_field, data=object_field_data, partial=True
                        )
                        if object_field_serializer.is_valid():
                            object_field_serializer.save()
                        else:
                            return Response(
                                object_field_serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                        # 通过 ObjectField 获取 Object
                        object_instance = object_field.object

                        # 更新 Object
                        object_data = request.data.get("object", {})
                        if object_data:
                            object_serializer = ObjectSerializer(
                                object_instance, data=object_data, partial=True
                            )
                            if object_serializer.is_valid():
                                object_serializer.save()
                            else:
                                return Response(
                                    object_serializer.errors,
                                    status=status.HTTP_400_BAD_REQUEST,
                                )

                # 更新 PageLayout
                page_layout_data = request.data.get("page_layout", {})
                if page_layout_data:
                    page_layout_instance = PageLayout.objects.get(page_list=page_list)
                    page_layout_serializer = PageLayoutSerializer(
                        page_layout_instance, data=page_layout_data, partial=True
                    )
                    if page_layout_serializer.is_valid():
                        page_layout_serializer.save()
                    else:
                        return Response(
                            page_layout_serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    # 更新 PageLayoutField
                    page_layout_fields = PageLayoutField.objects.filter(
                        page_layout=page_layout_instance
                    )
                    page_layout_fields_data = request.data.get("page_layout_fields", [])
                    for page_layout_field, page_layout_field_data in zip(
                        page_layout_fields, page_layout_fields_data
                    ):
                        page_layout_field_serializer = PageLayoutFieldSerializer(
                            page_layout_field, data=page_layout_field_data, partial=True
                        )
                        if page_layout_field_serializer.is_valid():
                            page_layout_field_serializer.save()
                        else:
                            return Response(
                                page_layout_field_serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST,
                            )

                return Response(page_list_serializer.data)
        except PageList.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        """删除账户（PageList, PageLayout, Object 及相关字段）"""
        try:
            # 获取 PageList
            page_list = PageList.objects.get(id=pk)

            with transaction.atomic():  # 保证数据一致性
                # 删除与 PageLayout 相关的字段
                page_layouts = PageLayout.objects.filter(page_list=page_list)
                for page_layout in page_layouts:
                    # 删除 PageLayoutField
                    PageLayoutField.objects.filter(page_layout=page_layout).delete()
                    # 删除 PageLayout
                    page_layout.delete()

                # 删除与 PageList 相关的字段
                PageListField.objects.filter(page_list=page_list).delete()

                # 删除 PageList
                page_list.delete()

                # 删除与 Object 相关的字段
                objects = Object.objects.filter(page_list=page_list)
                for obj in objects:
                    # 删除 ObjectField
                    ObjectField.objects.filter(object=obj).delete()
                    # 删除 Object
                    obj.delete()

                return Response(status=status.HTTP_204_NO_CONTENT)

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
