importScripts('chart-analyzer.js');
self.onmessage=e=>{try{const {samples,sampleRate,options}=e.data;self.postMessage({chart:AudioAnalysis.analyze(samples,sampleRate,options)});}catch(error){self.postMessage({error:error.message});}};
