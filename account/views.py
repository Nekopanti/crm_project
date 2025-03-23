import json
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from .models import (
    Object,
    ObjectField,
    PageList,
    PageListField,
    PageLayout,
    PageLayoutField,
    Account,
)
from .serializers import (
    ObjectSerializer,
    ObjectFieldSerializer,
    PageListSerializer,
    PageListFieldSerializer,
    PageLayoutSerializer,
    PageLayoutFieldSerializer,
    AccountSerializer,
)


# 自定义分页
class AccountPagination(PageNumberPagination):
    page_size = 20  # 每页显示 20 条数据
    page_size_query_param = "page_size"
    max_page_size = 100


class MainViewSet(ModelViewSet):
    serializer_class = AccountSerializer
    pagination_class = AccountPagination

    def get_queryset(self):
        """保持通用性：仅过滤未删除数据"""
        queryset = Account.objects.filter(deleted="0")

        # 搜索功能
        search = self.request.query_params.get("search")
        if search:
            # JSON 字段模糊搜索
            queryset = queryset.filter(
                # Q(data__account_name__icontains=search)  # 模糊匹配
                Q(data__account_name__istartswith=search)  # 首字母匹配
            )

        return queryset

    def list(self, request, *args, **kwargs):
        """获取全部账户信息（Object + ObjectField + PageList + PageListField + t_account）"""
        try:
            # 获取 object_id 参数
            object_id = request.query_params.get("object_id")
            if not object_id:
                return Response(
                    {"error": "缺少 object_id 参数"}, status=status.HTTP_400_BAD_REQUEST
                )
            # 获取排序字段和排序顺序
            sort_field = request.query_params.get('sort_field', 'account_name')
            sort_order = request.query_params.get('sort_order', 'asc')

            # 确保字段有效，防止 SQL 注入
            if sort_field not in ['account_name', 'department', 'hospital']:
                sort_field = 'account_name'

            if sort_order not in ['asc', 'desc']:
                sort_order = 'asc'

            # 获取字段映射
            field_map, error = get_field_map(object_id)
            if error:
                return Response({"error": error}, status=status.HTTP_404_NOT_FOUND)

            # 查询数据
            queryset = self.get_queryset().filter(object_id=object_id)
            # 排序
            if sort_order == 'asc':
                sorted_queryset = queryset.order_by(f"data__{sort_field}")
            else:
                sorted_queryset = queryset.order_by(f"-data__{sort_field}")
            # 分页
            page = self.paginate_queryset(sorted_queryset)

            if page is None:
                return Response(
                    {"error": "分页数据不存在"}, status=status.HTTP_404_NOT_FOUND
                )

            # 动态生成返回数据
            result = []
            for account in page:
                parsed_data = account.data
                data = {
                    field_map.get(field, field): parsed_data.get(field, "N/A")
                    for field in field_map
                }
                data["id"] = account.id
                result.append(data)

            return self.get_paginated_response(result)
        except Exception as e:
            return Response(
                {"code": 500, "error": f"服务器内部错误: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, pk=None):
        """获取某个账户详情（PageLayout + PageLayoutField + t_account）"""
        try:
            # 获取前端传入参数
            pagelist_id = request.query_params.get("pagelist_id")

            if not pagelist_id:
                return Response(
                    {"error": "缺少 pagelist_id"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 获取Account业务数据
            try:
                account = Account.objects.get(id=pk)
            except Account.DoesNotExist:
                return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)

            # 获取PageLayout对象
            try:
                page_layout = PageLayout.objects.get(page_list_id=pagelist_id)
            except PageLayout.DoesNotExist:
                return Response({"error": "PageLayout 未找到"}, status=status.HTTP_404_NOT_FOUND)

            # 获取PageLayoutField对象
            page_layout_fields = PageLayoutField.objects.filter(page_layout=page_layout)

            # 匹配所有PageLayoutField和ObjectField内对应的mapping
            display_labels = dict(page_layout_fields.values_list("object_field__name", "name"))

            # 过滤出业务数据
            filtered_data = {field: account.data.get(field, "") for field in display_labels.keys()}

            # 替换 key，使其变为 pagelayoutfield 里的 name
            formatted_account_data = {display_labels[field] : value for field, value in filtered_data.items()}

            # # 追加基础字段**
            # filtered_data.update({
            #     "id": str(account.id),
            #     "updated_at": account.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            #     "created_at": account.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            # })

            return Response({
                "page_layout": {
                    "name": page_layout.name
                },
                "filtered_data": formatted_account_data,
                "account_data": {
                    "account_name": account.data.get("account_name"),
                    "hospital": account.data.get("hospital"),
                    "department": account.data.get("department"),
                    "phone": account.data.get("phone"),
                    **account.data,  # 其他未列出的字段保持原顺序
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"服务器内部错误: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request):
        """创建账户（Object + t_account）"""
        try:
            with transaction.atomic():  # 保证数据一致性
                # 获取前端传入参数
                object_id = request.data.get("object_id")
                account_data = request.data.get("data", {})

                if not object_id:
                    return Response(
                        {"error": "缺少 object_id 参数"}, status=status.HTTP_400_BAD_REQUEST
                    )
                if not isinstance(account_data, dict):
                    return Response({"error": "data 参数格式应为字典"}, status=status.HTTP_400_BAD_REQUEST)

                # 获取关联Object
                try:
                    obj = Object.objects.get(id=object_id)
                except ObjectDoesNotExist:
                    return Response(
                        {"error": "关联的 Object 不存在"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                serializer_data = {
                    "object": obj.id,
                    "data": account_data
                }
                account_serializer = AccountSerializer(data=serializer_data)

                if account_serializer.is_valid():
                    account_serializer.save()
                    return Response(
                        {"message": "创建成功"},
                        status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(account_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Account.DoesNotExist:
            return Response({"error": "Account 不存在"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": f"服务器内部错误: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, pk=None):
        """更新 Account 数据"""
        try:
            with transaction.atomic():  # 开启事务
                # 获取 Account 实例
                account = Account.objects.get(id=pk)

                # 更新 Account 的 data 字段
                account_data = request.data  # 直接使用请求的数据
                account_serializer = AccountSerializer(account, data={"data": account_data}, partial=True)

                if account_serializer.is_valid():
                    account_serializer.save()
                    return Response({"message": "更新成功"}, status=status.HTTP_200_OK)
                else:
                    raise ValidationError(account_serializer.errors)

        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Account.DoesNotExist:
            return Response({"error": "Account 不存在"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": f"服务器内部错误: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, pk=None):
        """删除Account账户"""
        try:
            with transaction.atomic():
                account = Account.objects.get(id=pk)
                account.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Account.DoesNotExist:
            return Response({"error": "账户不存在"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": f"删除失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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


class AccountViewSet(ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


def get_field_map(object_id):
    """生成字段映射"""
    try:
        obj = Object.objects.get(id=object_id)
    except Object.DoesNotExist:
        return {}, "Object 不存在"

    # ✅ 查询关联的 PageList
    page_list = (
        PageList.objects.filter(pagelistfield__object_field__object=obj, deleted="0")
        .distinct()
        .first()
    )
    if not page_list:
        return {}, "未找到页面配置"

    # ✅ 查询 PageListField 并生成字段映射
    page_list_fields = PageListField.objects.filter(
        page_list=page_list, deleted="0", hidden="0"
    )

    if not page_list_fields.exists():
        return {}, "未配置展示字段"

    # ✅ 映射规则：{业务字段名: 显示名称}
    field_map = {field.object_field.name: field.name for field in page_list_fields}

    return field_map, None


def parse_data_field(data):
    if not data:
        return {}
    if isinstance(data, str):
        return json.loads(data)
    return data


def filter_data_by_fields(data, field_map):
    return {
        field_map.get(key, key): value
        for key, value in data.items()
        if key in field_map
    }
