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
    page_size = 10  # 每页显示 10 条数据
    page_size_query_param = "page_size"
    max_page_size = 100  # 限制最大分页


class AccountViewSet(ModelViewSet):
    """
    Account 视图：
    - 获取账户列表（PageList + PageListField）
    - 获取账户详情（PageLayout + PageLayoutField）
    - 创建账户（Object + ObjectField）
    - 修改账户（Object + 相关字段）
    - 删除账户（Object 及相关字段）
    """

    # 默认查询 PageList（因为列表视图主要来自 PageList）
    queryset = PageList.objects.all()
    serializer_class = PageListSerializer  # 主要序列化器
    pagination_class = AccountPagination  # 启用分页
    filter_backends = [SearchFilter, OrderingFilter]  # 支持搜索 & 排序
    search_fields = ["name"]  # 允许通过 name 搜索
    ordering_fields = ["id", "name"]  # 允许排序字段
    ordering = ["id"]  # 默认按 id 排序

    def retrieve(self, request, pk=None):
        """获取某个账户详情（PageLayout + PageLayoutField）"""
        try:
            page_layout = PageLayout.objects.get(id=pk)
            serialized_page_layout = PageLayoutSerializer(page_layout).data

            page_layout_fields = PageLayoutField.objects.filter(page_layout=page_layout)
            serialized_page_layout_fields = PageLayoutFieldSerializer(
                page_layout_fields, many=True
            ).data

            return Response(
                {
                    "layout": serialized_page_layout,
                    "fields": serialized_page_layout_fields,
                }
            )
        except PageLayout.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """创建账户（Object + ObjectField）"""
        with transaction.atomic():
            object_data = request.data.get("object", {})
            object_serializer = ObjectSerializer(data=object_data)

            if object_serializer.is_valid():
                obj = object_serializer.save()

                # 处理 ObjectField
                fields_data = request.data.get("fields", [])
                for field_data in fields_data:
                    field_data["object"] = obj.id
                    field_serializer = ObjectFieldSerializer(data=field_data)
                    if field_serializer.is_valid():
                        field_serializer.save()
                    else:
                        return Response(
                            field_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                        )

                return Response(object_serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                object_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, pk=None):
        """修改账户（Object + 相关字段）"""
        try:
            obj = Object.objects.get(id=pk)
            object_serializer = ObjectSerializer(
                obj, data=request.data.get("object", {}), partial=True
            )

            if object_serializer.is_valid():
                object_serializer.save()

                # 更新 ObjectField
                fields_data = request.data.get("fields", [])
                for field_data in fields_data:
                    field = ObjectField.objects.get(id=field_data["id"])
                    field_serializer = ObjectFieldSerializer(
                        field, data=field_data, partial=True
                    )
                    if field_serializer.is_valid():
                        field_serializer.save()
                    else:
                        return Response(
                            field_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                        )

                return Response(object_serializer.data)
            return Response(
                object_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except Object.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        """删除账户（Object 及相关字段）"""
        try:
            obj = Object.objects.get(id=pk)
            with transaction.atomic():
                ObjectField.objects.filter(object=obj).delete()
                PageListField.objects.filter(page_list__object=obj).delete()
                PageLayoutField.objects.filter(page_layout__object=obj).delete()
                obj.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Object.DoesNotExist:
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
