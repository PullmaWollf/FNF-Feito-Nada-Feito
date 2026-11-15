"""Run with python -m game.validate_charts. No server required."""
from .charts import make_chart, DIFFICULTIES

def validate(c):
    assert c['duration']>0 and c['bpm']>0
    ids=set()
    previous=-1
    for n in c['notes']:
        assert n['id'] not in ids, f"Duplicate {n['id']}"
        ids.add(n['id'])
        assert n['time']>=previous and 0<=n['time']<c['duration'], n
        previous=n['time']
        assert n['hold']>=0 and n['time']+n['hold']<=c['duration'],n
        assert n['lane'] in range(4) and n['side'] in ('player','enemy'),n
    assert all(0<=a<c['duration'] for a in c['attacks'])
    return len(c['notes'])

if __name__=='__main__':
    for level in range(1,5):
        for difficulty in DIFFICULTIES:
            c=make_chart(level,difficulty)
            print(f"{level}/{difficulty}: {validate(c)} notes OK")
