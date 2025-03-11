from rest_framework import serializers
from .models import (
    Object,
    ObjectField,
    PageList,
    PageListField,
    PageLayout,
    PageLayoutField,
)


# Object 序列化器
class ObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Object
        fields = "__all__"


# ObjectField 序列化器
class ObjectFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjectField
        fields = "__all__"


# PageList 序列化器
class PageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageList
        fields = "__all__"


# PageListField 序列化器
class PageListFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageListField
        fields = "__all__"


# PageLayout 序列化器
class PageLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageLayout
        fields = "__all__"


# PageLayoutField 序列化器
class PageLayoutFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageLayoutField
        fields = "__all__"
