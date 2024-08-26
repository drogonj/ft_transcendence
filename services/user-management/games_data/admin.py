from django.contrib import admin
from games_data.models import Match

class MatchAdmin(admin.ModelAdmin):
    list_display = (
        'player0',
        'player1',
        'score0',
        'score1',
        'winner',
        'date'
    )
    search_fields = (
        'player0',
        'player1'
    )

    readonly_fields = (
        'player0',
        'player1',
        'score0',
        'score1',
        'winner',
        'date'
    )

admin.site.register(Match, MatchAdmin)
