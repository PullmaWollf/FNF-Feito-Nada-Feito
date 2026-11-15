"""Seeded phrase arrangements with syncopation, variations and final-stage bursts."""
import random
LEVELS = [
    dict(id=1, name='Pavio Curto', subtitle='Todo mundo tem um limite.', bpm=128, bars=24, speed=340, anger='IRRITADO', color='#c3f451'),
    dict(id=2, name='Pressão Alta', subtitle='Você está testando a paciência dele.', bpm=158, bars=28, speed=435, anger='FURIOSO', color='#ffac45'),
    dict(id=3, name='CRASHOUT', subtitle='Sem filtro. Sem freio. Sem piedade.', bpm=190, bars=32, speed=530, anger='FORA DE CONTROLE', color='#ff4a6c'),
]
PHRASES = [[0,2,1,3,2,0,3,1], [0,0,2,3,1,2,3,0], [3,2,1,0,1,3,0,2], [0,1,2,1,3,2,0,3]]
def make_chart(level):
    meta = LEVELS[level-1]
    beat = 60 / meta['bpm']
    notes = []
    rng = random.Random(7341 + level * 177)
    rhythms = [
        [[0,2,4,6,10,12], [0,3,4,8,10,14], [0,2,6,8,11,12,14], [0,4,7,8,12,14]],
        [[0,2,3,6,8,10,12,15], [0,1,4,6,7,10,12,14], [0,2,5,6,8,9,12,14,15], [0,3,4,6,8,11,12,14]],
        [[0,1,2,4,5,6,8,10,11,12,14,15], [0,2,3,4,6,7,8,9,12,13,14], [0,1,3,4,5,7,8,10,12,14,15], [0,2,4,5,6,7,8,9,10,12,13,15]],
    ][level-1]
    for bar in range(meta['bars']):
        side = 'enemy' if bar % 4 < 2 else 'player'
        rhythm = rhythms[rng.randrange(len(rhythms))]
        phrase = PHRASES[rng.randrange(len(PHRASES))]
        shift = rng.randrange(4)
        reverse = rng.choice([1,-1])
        for step, grid in enumerate(rhythm):
            lane = (phrase[step % 8] * reverse + shift) % 4
            sustain = beat * .55 if step == len(rhythm)-1 and bar % 4 == 3 else 0
            n = dict(time=round((4+bar*4+grid/4)*beat,5), lane=lane, side=side, hold=round(sustain,5), pitch=(lane+[0,3,5,7][bar//4%4]+(12 if bar%8>=6 else 0)))
            notes.append(n)
            if level >= 2 and bar >= 8 and step in (2,6) and rng.random() < (.35 if level == 2 else .7):
                notes.append(dict(n, lane=(lane+2)%4, hold=0, pitch=n['pitch']+7))
        # The crashout interrupts the player's phrases with extra rival responses.
        if level == 3 and side == 'player' and bar >= 12:
            for grid in (1,5,9,13):
                notes.append(dict(time=round((4+bar*4+grid/4)*beat,5),lane=rng.randrange(4),side='enemy',hold=0,pitch=rng.choice([0,3,7,10])))
    attacks = [round((4+b*4+1)*beat,5) for b in range(5,meta['bars'],3)] if level == 3 else []
    return dict(**meta, duration=(4+meta['bars']*4+2)*beat, notes=sorted(notes,key=lambda n:n['time']), attacks=attacks)
