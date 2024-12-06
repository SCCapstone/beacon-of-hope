from django import forms
from django.core.exceptions import ValidationError
import json


class RecommendationForm(forms.Form):
    user_info = JSONField()

    ...
