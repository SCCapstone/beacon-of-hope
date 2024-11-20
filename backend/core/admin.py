from django.contrib import admin
from .models import UserPreference, MenuItem

admin.site.register(UserPreference)
admin.site.register(MenuItem)