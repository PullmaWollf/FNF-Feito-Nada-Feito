"""Author the supplied MP3 chart from ASR word timing + measured audio onsets.
Requires numpy and imageio-ffmpeg only when rebuilding, not when serving.
"""
import json, subprocess
from pathlib import Path
import numpy as np
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parent.parent
raw=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(ROOT/'static/media/cartman-kyle.mp3'),'-ac','1','-ar','16000','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
samples=np.frombuffer(raw,dtype=np.float32)
rate=16000;hop=160;window=640
frames=np.lib.stride_tricks.sliding_window_view(samples,window)[::hop]
spec=np.abs(np.fft.rfft(frames*np.hanning(window),axis=1))
flux=np.maximum(0,np.diff(spec,axis=0)).sum(axis=1)
threshold=np.percentile(flux,73)
peaks=[(i+1)*hop/rate for i in range(1,len(flux)-1) if flux[i]>threshold and flux[i]>flux[i-1] and flux[i]>=flux[i+1]]
lag=max(range(30,71),key=lambda lag:np.dot(flux[lag:],flux[:-lag]))
bpm=60/(lag*hop/rate)
transcript_path=ROOT/'game/supplied_transcript_small.json'
if not transcript_path.exists():transcript_path=ROOT/'game/supplied_transcript.json'
segments=json.loads(transcript_path.read_text(encoding='utf8'))
kyle_ranges=[(2.3,3.2),(7.6,8.8),(10.5,11.8),(14.0,15.0),(16.6,18.7),(25.7,27.5)]
def speaker(t):return 'enemy' if any(a<=t<=b for a,b in kyle_ranges) else 'player'
events=[]
subtitles=[]
for s in segments:
    words=s['words']
    # Keep ASR cues tied to detected word timing; no invented missing lyrics.
    for j in range(0,len(words),7):
        group=words[j:j+7]
        if group:subtitles.append(dict(start=group[0]['start'],end=max(group[0]['start']+.15,group[-1]['end']),text=' '.join(w['text'] for w in group),speaker='Kyle' if speaker(group[0]['start'])=='enemy' else 'Cartman',automatic=True))
    for word in words:
        if word.get('probability',1)<.25:continue
        start=word['start'];end=word['end']
        near=[p for p in peaks if abs(p-start)<.075]
        time=min(near,key=lambda p:abs(p-start)) if near else start
        events.append((time,speaker(time)))
        if end-start>.32:
            events.extend((p,speaker(p)) for p in peaks if start+.15<p<end-.08)
# The multilingual chorus has poor ASR coverage. Use measured onsets there,
# without fabricating subtitles or claiming speech identification.
for p in peaks:
    if 54<p<84:events.append((p,'player'))
for start,end in [(54,61),(61,68),(68,75),(75,84)]:
    subtitles.append(dict(start=start,end=end,text='[Coro em outros idiomas]',speaker='Coro',automatic=True))
subtitles.sort(key=lambda s:s['start'])
# Correct the chorus excerpt explicitly supplied in the user's request.
subtitles=[s for s in subtitles if not 19.0<=s['start']<22.0]
subtitles += [dict(start=19.1,end=20.5,text="Kyle's mom's a bitch, she's a big fat bitch",speaker='Cartman',automatic=False),dict(start=20.5,end=21.98,text="She's the biggest bitch in the whole wide world",speaker='Cartman',automatic=False)]
subtitles.sort(key=lambda s:s['start'])
events.sort()
notes=[];previous={'enemy':-1,'player':-1};last_lane={'enemy':-1,'player':-1}
for time,side in events:
    if time-previous[side]<.115 or time>len(samples)/rate-.2:continue
    frame=min(len(spec)-1,int(time*rate/hop))
    bands=[spec[frame,int(a*window/rate):int(b*window/rate)].sum() for a,b in [(120,400),(400,850),(850,1600),(1600,3600)]]
    lane=int(np.argmax(bands))
    if lane==last_lane[side] and time-previous[side]<.28:lane=(lane+1)%4
    notes.append(dict(time=round(time,5),side=side,lane=lane,hold=0,pitch=0))
    previous[side]=time;last_lane[side]=lane
data=dict(audio_duration=len(samples)/rate,bpm=round(bpm,2),notes=notes,subtitles=subtitles,source='User supplied MP3',analysis='ASR word timestamps + spectral onsets; dialogue speaker ranges reviewed against transcript',transcriptAutomatic=True)
(ROOT/'game/cartman_audio_chart.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
print('Duration:',data['audio_duration'],'BPM:',data['bpm'],'Notes:',len(notes),'Cues:',len(subtitles))
