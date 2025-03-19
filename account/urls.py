from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    get_all_objects,
    MainViewSet,
    ObjectViewSet,
    ObjectFieldViewSet,
    PageListViewSet,
    PageListFieldViewSet,
    PageLayoutViewSet,
    PageLayoutFieldViewSet,
    AccountViewSet,
)

router = DefaultRouter()
router.register(r"main", MainViewSet, basename="main")
router.register(r"objects", ObjectViewSet)
router.register(r"object-fields", ObjectFieldViewSet)
router.register(r"page-lists", PageListViewSet)
router.register(r"page-list-fields", PageListFieldViewSet)
router.register(r"page-layouts", PageLayoutViewSet)
router.register(r"page-layout-fields", PageLayoutFieldViewSet)
router.register(r"accounts", AccountViewSet)


urlpatterns = [
    path("", include(router.urls)),  # 让 DRF 自动处理所有路由
    path("all-objects/", get_all_objects, name="get_all_objects"),
]
