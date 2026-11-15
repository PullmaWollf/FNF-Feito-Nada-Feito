from django.http import JsonResponse, Http404
from django.shortcuts import render
from .charts import LEVELS, SECRET, DIFFICULTIES, make_chart
def index(request):
    return render(request, 'index.html')
def levels(request):
    secret_chart=make_chart(4,'hard')
    secret={key:secret_chart[key] for key in SECRET}
    secret['duration']=secret_chart['duration']
    return JsonResponse({'levels': LEVELS,'secret':secret})
def chart(request, level):
    if not 1 <= level <= 4:
        raise Http404
    difficulty = request.GET.get('difficulty','hard')
    if difficulty not in DIFFICULTIES:
        return JsonResponse({'error':'Invalid difficulty'},status=400)
    return JsonResponse(make_chart(level,difficulty))
