from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountAdmin(admin.ModelAdmin):
    list_display = (
        'username',
        'date_joined',
        'last_login',
        'is_admin',
        'is_active',
    )

admin.site.register(User, AccountAdmin)
