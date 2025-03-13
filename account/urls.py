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
router.register(r"objects", ObjectViewSet)
router.register(r"object-fields", ObjectFieldViewSet)
router.register(r"page-lists", PageListViewSet)
router.register(r"page-list-fields", PageListFieldViewSet)
router.register(r"page-layouts", PageLayoutViewSet)
router.register(r"page-layout-fields", PageLayoutFieldViewSet)

urlpatterns = [
    # path(
    #     "accounts/create/",
    #     AccountViewSet.as_view({"post": "create"}),
    #     name="account-create",
    # ),
    # path(
    #     "accounts/<uuid:pk>/",
    #     AccountViewSet.as_view(
    #         {"get": "retrieve", "put": "update", "delete": "destroy"}
    #     ),
    #     name="account-detail",
    # ),
    # path(
    #     "accounts/<uuid:pk>/edit/",
    #     AccountViewSet.as_view({"put": "update"}),
    #     name="account-edit",
    # ),
    path("", include(router.urls)),  # 让 DRF 自动处理所有路由
]
