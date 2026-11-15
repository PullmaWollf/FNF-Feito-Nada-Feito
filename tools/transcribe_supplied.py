"""Offline authoring helper. Not installed or executed on Vercel."""
import json
import subprocess
import sys
import numpy as np
import imageio_ffmpeg
from pathlib import Path
from faster_whisper import WhisperModel

root=Path(__file__).resolve().parent.parent
model_name=sys.argv[1] if len(sys.argv)>1 else 'base.en'
model=WhisperModel(model_name,device='cpu',compute_type='int8')
pcm=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(root/'static/media/cartman-kyle.mp3'),'-ac','1','-ar','16000','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
segments,info=model.transcribe(np.frombuffer(pcm,dtype=np.float32),language='en',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=False,repetition_penalty=1.1)
data=[]
for segment in segments:
    row=dict(start=segment.start,end=segment.end,text=segment.text.strip(),words=[dict(start=w.start,end=w.end,text=w.word.strip(),probability=w.probability) for w in segment.words or []])
    data.append(row)
    print(f'{segment.start:.2f} - {segment.end:.2f}',flush=True)
(root/('game/supplied_transcript_small.json' if model_name=='small' else 'game/supplied_transcript.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Transcript saved',len(data),flush=True)
