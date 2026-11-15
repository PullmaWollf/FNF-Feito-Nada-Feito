# Upgrade MP3, Cartman/Kyle e Vercel

## Implementado

- A fase secreta usa **Cartman como jogador** e **Kyle como adversário**. As referências PNG fornecidas são desenhadas em camadas com movimentos de cabeça/corpo, poses direcionais, boca e dano. O cenário escolar é desenhado em Canvas e fica em cache.
- O MP3 fornecido é pré-carregado e decodificado antes da contagem. A síntese procedural não toca sobre essa faixa. Pausar suspende o mesmo AudioContext; retomar preserva a posição do BufferSource.
- `game/cartman_audio_chart.json` contém ataques vocais e cues extraídos do arquivo real, não de uma versão alternativa da música. O script de autoria combina timestamps de palavras (Whisper local) e ataques espectrais. Intervalos de diálogo de Kyle foram marcados a partir da transcrição. O BPM estimado serve à grade e à animação, sem esticar ou alterar o áudio.
- A letra grande no centro foi removida. Cues temporizados aparecem perto da barra de vida. O trecho do refrão fornecido no pedido foi corrigido. As demais legendas são automáticas e podem conter erros. O coro em outros idiomas é indicado como coro, sem inventar sua transcrição. Não há promessa de separação perfeita de falantes.
- Story Mode avança sozinho após uma transição de cerca de 2,3 segundos. O contexto de áudio é reutilizado entre as fases para preservar a autorização de autoplay no mobile. Apenas a última fase abre o resultado final.
- Swipe de um dedo atravessa todas as lanes intermediárias em ambos os sentidos; a lane final permanece pressionada para holds. Outro dedo continua sendo rastreado separadamente.
- Notas agora usam texturas em cache com letras DFJK. Isso reduz redesenho de arcos/texto por quadro e melhora identificação sem depender só de cor. Resolução mobile é limitada e o modo de desempenho continua disponível.
- O menu ganhou animações e uma trilha original leve em buffer. Ela começa após uma interação por limitação de autoplay, pausa ao entrar no jogo e ao ocultar a aba.
- Estúdio MP3: importa MP3/WAV/OGG, escolhe jogador/rival/dificuldade, decodifica e analisa o ritmo em Worker, salva arquivo e mapa no IndexedDB e permite jogar. Limites: 30 MB e duração de 5 segundos a 5 minutos. Os dados não são enviados ao servidor.
- O importador é **análise automática de sinal**, não uma IA que entende letras ou separa Cartman de Kyle em qualquer arquivo. A transcrição por IA foi usada offline para autorar a faixa fornecida; modelos grandes não são carregados no telefone nem na Vercel.
- `vercel.json`, `.python-version`, `.vercelignore` e settings de produção preparados para importação do GitHub no framework Django. Veja `VERCEL.md`.

## Arquivos principais

| Área | Arquivos |
|---|---|
| MP3 e gráficos fornecidos | `static/media/*` |
| Mapa real e falas | `game/cartman_audio_chart.json`, `game/charts.py` |
| Autoria opcional offline | `tools/transcribe_supplied.py`, `tools/build_supplied_chart.py` |
| Análise/importação local | `static/chart-analyzer.js`, `analysis-worker.js`, `studio.js` |
| Menu e animações | `static/menu-music.js`, `art.js`, `style.css` |
| Integração, swipe e transições | `static/game.js`, `templates/index.html` |
| Deploy | `vercel.json`, `.python-version`, `.vercelignore`, `config/settings.py` |
| Verificação | `game/tests.py`, `tests/*.test.cjs`, `.github/workflows/tests.yml` |

## Testes e limites

Executados: seis testes Python, validação dos 16 mapas, sintaxe JS, suites Node de timing, analisador, integração e AudioEngine. Integração inclui transição automática, história Hard/Insane, MP3 decodificado com mocks, desbloqueios e oito notas acertadas por swipes de ida/volta.

No navegador real: importação do MP3 via seletor de arquivo, análise em Worker, biblioteca preservada após reload, reprodução do áudio importado, personagens/cenário, pausa e retorno; sem erros de console observados nesse fluxo. Os testes de navegador não constituem avaliação auditiva profissional nem uma partida perfeita manual.

Não foi publicado um deployment Vercel, pois o usuário vai criar o projeto. A configuração e o check de produção foram validados localmente. ASR e detecção de ataque têm incerteza: os mapas e legendas automáticos admitem revisão editorial futura, sobretudo no coro multilíngue. O áudio não foi substituído por silêncio ou loops artificiais.
