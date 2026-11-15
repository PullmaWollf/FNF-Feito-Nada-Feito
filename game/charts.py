"""Seeded phrase arrangements with syncopation, variations and final-stage bursts."""
import random
LEVELS = [
    dict(id=1, name='Pavio Curto', subtitle='Todo mundo tem um limite.', bpm=128, bars=56, speed=460, anger='IRRITADO', color='#c3f451'),
    dict(id=2, name='Pressão Alta', subtitle='Você está testando a paciência dele.', bpm=158, bars=68, speed=590, anger='FURIOSO', color='#ffac45'),
    dict(id=3, name='CRASHOUT', subtitle='Sem filtro. Sem freio. Sem piedade.', bpm=190, bars=80, speed=720, anger='FORA DE CONTROLE', color='#ff4a6c'),
]
PHRASES = [[0,2,1,3,2,0,3,1], [0,0,2,3,1,2,3,0], [3,2,1,0,1,3,0,2], [0,1,2,1,3,2,0,3]]
MELODIES = [
    [0,3,7,10,7,5,3,2,0,2,3,7],
    [7,10,12,10,7,5,3,5,7,5,3,0],
    [3,5,7,12,10,7,5,3,2,3,5,7],
    [10,7,5,3,5,7,3,2,0,2,3,0],
]
DIFFICULTIES = ('easy', 'medium', 'hard', 'insane')
SECRET = dict(id=4,name='Respect My Rhythm',subtitle='Cartman não aceita perder. Dueto original no final.',bpm=172,bars=72,speed=690,anger='BÔNUS SECRETO',color='#f6d44b')

def finalize_chart(c):
    c.update(chart_version=3,meter='4/4',key='C minor',offset=0)
    names=['INTRO','CONSTRUÇÃO','VERSO','REFRÃO','BREAK','CLÍMAX','OUTRO']
    energies=[.45,.65,.8,1,.35,1,.5]
    fractions=[0,.1,.22,.42,.56,.66,.92,1]
    beat=60/c['bpm']
    c['sections']=[dict(name=name,start=(4+c['bars']*4*fractions[i])*beat,end=min(c['duration'],(4+c['bars']*4*fractions[i+1])*beat),energy=energies[i]) for i,name in enumerate(names)]
    for n in c['notes']:
        n['id']=f"{n['side']}:{n['time']}:{n['lane']}"
    return c

def secret_chart(difficulty):
    beat=60/SECRET['bpm']
    notes=[]
    for bar in range(SECRET['bars']):
        phase=min(3,bar//18)
        steps=[4,6,8,12][phase]
        for i in range(steps):
            side='enemy' if bar%4<2 else 'player'
            time=round((4+bar*4+i*4/steps)*beat,5)
            n=dict(time=time,lane=(i+bar)%4,side=side,hold=0,pitch=MELODIES[bar//4%4][i%12])
            notes.append(n)
            if bar>=56:
                notes.append(dict(n,side='player' if side=='enemy' else 'enemy'))
            if phase==3 and i%4==2:
                notes.append(dict(n,lane=(n['lane']+2)%4))
    notes.sort(key=lambda n:n['time'])
    music=[dict(n) for n in notes]
    if difficulty in ('easy','medium'):
        notes=[n for i,n in enumerate(notes) if i%(4 if difficulty=='easy' else 2)==0]
    elif difficulty=='hard':
        seen=set()
        notes=[n for n in notes if (n['side'],n['time']) not in seen and not seen.add((n['side'],n['time']))]
    return finalize_chart(dict(**SECRET,difficulty=difficulty,duration=(4+SECRET['bars']*4+2)*beat,notes=notes,music=music,attacks=[],duet_start=(4+56*4)*beat))

def make_chart(level, difficulty='hard'):
    if difficulty not in DIFFICULTIES:
        raise ValueError('Invalid difficulty')
    if level==4:
        return secret_chart(difficulty)
    meta = dict(LEVELS[level-1])
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
            melody = MELODIES[(bar//4 + level-1) % len(MELODIES)]
            # Rival calls and player answers share an actual melodic phrase.
            # Lanes may vary without scrambling the melody into random pitches.
            target = melody[(step + (4 if bar%2 else 0)) % len(melody)] + [0,-4,3,-2][bar//4%4]
            pitch = min((p for p in range(-12,25) if p%12 in (0,2,3,5,7,8,10)), key=lambda p:abs(p-target))
            n = dict(time=round((4+bar*4+grid/4)*beat,5), lane=lane, side=side, hold=round(sustain,5), pitch=pitch)
            notes.append(n)
        # The crashout interrupts the player's phrases with extra rival responses.
        if level == 3 and side == 'player' and bar >= 12:
            for grid in (1,5,9,13):
                notes.append(dict(time=round((4+bar*4+grid/4)*beat,5),lane=rng.randrange(4),side='enemy',hold=0,pitch=rng.choice([0,3,7,10])))
    attacks = [round((4+b*4+1)*beat,5) for b in range(5,meta['bars'],3)] if level == 3 else []
    music = sorted(notes,key=lambda n:n['time'])
    # Audio is independent of the selected chart density.
    notes = [dict(n) for side in ('enemy','player') for i,n in enumerate(n for n in music if n['side']==side) if difficulty not in ('easy','medium') or i % (4 if difficulty=='easy' else 2)==0]
    if difficulty == 'insane':
        extra = []
        for side in ('enemy','player'):
            sequence = sorted((n for n in notes if n['side']==side),key=lambda n:n['time'])
            for i,n in enumerate(sequence):
                if i%3==0:
                    extra.append(dict(n,lane=(n['lane']+2)%4,hold=0))
                # Sparse intermediate taps; most avoid repeating the next lane.
                # Chords above remain simultaneous notes in different lanes.
                if i%4==1 and i+1<len(sequence) and sequence[i+1]['time']-n['time'] > beat*.35 and not n['hold']:
                    lane = (n['lane']+1)%4
                    if i%12!=1 and lane==sequence[i+1]['lane']:
                        lane=(lane+1)%4
                    extra.append(dict(n,time=round(n['time']+beat*.25,5),lane=lane,hold=0))
        notes += extra
    notes = sorted({(n['side'],n['time'],n['lane']):n for n in notes}.values(),key=lambda n:n['time'])
    for i,n in enumerate(notes):
        if n['hold'] and any(m['side']==n['side'] and m['lane']==n['lane'] and n['time']<m['time']<n['time']+n['hold'] for m in notes[i+1:]):
            n['hold']=0
    return finalize_chart(dict(**meta, difficulty=difficulty, duration=(4+meta['bars']*4+2)*beat, music=music, notes=notes, attacks=attacks))
