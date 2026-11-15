from django.http import JsonResponse, Http404
from django.shortcuts import render
from .charts import LEVELS, DIFFICULTIES, make_chart
def index(request):
    return render(request, 'index.html')
def levels(request):
    return JsonResponse({'levels': LEVELS})
def chart(request, level):
    if not 1 <= level <= 3:
        raise Http404
    difficulty = request.GET.get('difficulty','hard')
    if difficulty not in DIFFICULTIES:
        return JsonResponse({'error':'Invalid difficulty'},status=400)
    return JsonResponse(make_chart(level,difficulty))
