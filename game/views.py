from django.http import JsonResponse, Http404
from django.shortcuts import render
from .charts import LEVELS, make_chart
def index(request):
    return render(request, 'index.html')
def levels(request):
    return JsonResponse({'levels': LEVELS})
def chart(request, level):
    if not 1 <= level <= 3:
        raise Http404
    return JsonResponse(make_chart(level))
