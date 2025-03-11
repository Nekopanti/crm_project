from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet,
    ObjectViewSet,
    ObjectFieldViewSet,
    PageListViewSet,
    PageListFieldViewSet,
    PageLayoutViewSet,
    PageLayoutFieldViewSet,
)

router = DefaultRouter()
router.register(r"accounts", AccountViewSet, basename="account")
# router.register(r"objects", ObjectViewSet)  # 对应 Object 模型
# router.register(r"object-fields", ObjectFieldViewSet)  # 对应 ObjectField 模型
# router.register(r"page-lists", PageListViewSet)  # 对应 PageList 模型
# router.register(r"page-list-fields", PageListFieldViewSet)  # 对应 PageListField 模型
# router.register(r"page-layouts", PageLayoutViewSet)  # 对应 PageLayout 模型
# router.register(
#     r"page-layout-fields", PageLayoutFieldViewSet
# )  # 对应 PageLayoutField 模型

urlpatterns = [
    path(
        "accounts/create/",
        AccountViewSet.as_view({"post": "create"}),
        name="account-create",
    ),
    path(
        "accounts/<uuid:pk>/",
        AccountViewSet.as_view(
            {"get": "retrieve", "put": "update", "delete": "destroy"}
        ),
        name="account-detail",
    ),
    path(
        "accounts/<uuid:pk>/edit/",
        AccountViewSet.as_view({"put": "update"}),
        name="account-edit",
    ),
    path("", include(router.urls)),  # 让 DRF 自动处理所有路由
]
