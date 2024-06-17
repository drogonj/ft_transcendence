from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountAdmin(admin.ModelAdmin):
    list_display = (
        'intra_id',
        'username',
        'email',
        'date_joined',
        'last_login',
        'is_admin',
        'is_active',
    )
    search_fields = (
        'username',
    )

    readonly_fields = (
        'id',
        'date_joined',
        'last_login',
    )

admin.site.register(User, AccountAdmin)
