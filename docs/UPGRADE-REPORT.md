# Upgrade: Story Mode e fundamentos da especificação

## Auditoria e plano executado

Foram lidos os requisitos do TXT e as seis páginas do PDF fornecidos pelo usuário, além de README, rotas, configurações, dependências, geração dos mapas, regras, renderização, áudio e testes. O projeto é Django sem banco de dados; Canvas e Web Audio executam o cliente. Não houve migração de framework.

No início desta auditoria, o trabalho de Story Mode já estava em andamento. A suíte Python tinha cinco testes: quatro passaram e um falhou porque ainda esperava 404 para a nova fase 4. O teste foi atualizado junto com cobertura específica da fase secreta. O estado anterior publicado havia passado nos cinco testes.

Problemas confirmados no código: seleção da primeira nota elegível em vez da mais próxima; possibilidade de soltar um hold muito cedo antes da primeira verificação; transição entre músicas sem retornar a Promise do carregamento; callbacks de carregamentos antigos podiam atribuir o chart antes de conferir a geração da partida. Corrigidos incrementalmente.

Ordem executada: P0 timing/holds/relógio e regressão; progressão solicitada; AudioEngine e mix/calibração; validação dos charts; resultados e acessibilidade; testes e smoke test no navegador.

## Funcionalidades

- Story Mode exige três vitórias consecutivas na mesma dificuldade. Sair e iniciar outra história reinicia a sequência; derrota permite repetir a fase atual.
- Freeplay bloqueado até concluir a história. Concluir no Insane também libera Respect My Rhythm, contra Cartman, com desenho vetorial feito para este projeto, quatro seções de densidade crescente e dueto nos compassos finais.
- A letra completa ou a gravação da canção comercial não foi incluída. O dueto usa composição sintetizada original e exibe somente o trecho fornecido pelo usuário. Não é uma reprodução da música oficial.
- Desbloqueios persistem localmente; são progressão de um jogo offline, não uma proteção de servidor ou sistema competitivo.
- Tamanho de notas e scrollspeed independentes, volumes geral/harmonia/bateria/baixo/vocais/SFX, calibração guiada, perfis de timing, redução de efeitos, modo de desempenho e treino em Freeplay. Treino não concede recordes ou desbloqueios.
- Resultados: rank, Full Combo/All Perfect, score, precisão, maior combo, misses e distribuição dos julgamentos. Recordes por música/dificuldade/versão 3 do mapa.

## Timing e regras

Clock central deriva de AudioContext.currentTime, corrigindo a estimativa de saída com getOutputTimestamp quando disponível. Offset manual/calibrado é separado dessa compensação. O teste guiado mede o atraso combinado percebido de áudio, dispositivo e reação/input; não consegue isolar latência física de entrada sem hardware de medição.

Janelas padrão inclusivas: Sick até 45 ms, Good até 90 ms, Bad até 130 ms, Shit até 160 ms; acima disso é Miss. Perfis Preciso e Relaxado são mostrados nas configurações. Empates entre notas equidistantes preservam a anterior. Cada início de nota só é consumido uma vez. Ghost tap não pontua e não penaliza. Soltar uma sustentação mais de 80 ms antes do fim gera uma falha de sustentação, registrada uma vez; o início e a continuidade são componentes distintos. Retomar dá 250 ms para recuperar um hold cujo input tenha sido solto durante a pausa.

Accuracy = soma dos pesos / quantidade de componentes julgados. Pesos: Sick 1, Good 200/350, Bad 100/350, Shit 50/350, Miss 0. Concluir hold dá 150 pontos adicionais sem inflar accuracy. Acordes são notas independentes nas lanes. Ranks S >=95%, A >=90%, B >=80%, C >=70%, D abaixo. Full Combo exige zero misses; All Perfect também exige todos os inícios Sick. Ataques afetam vida e combo, não o julgamento musical.

## Arquivos alterados e responsabilidades

| Arquivos | Motivo |
|---|---|
| `game/charts.py`, `game/views.py` | Fase secreta, seções, IDs, versão e metadados |
| `game/validate_charts.py`, `game/tests.py` | Validação de 16 mapas e cobertura Python |
| `static/engine.js` | Nota mais próxima, Clock, validação, desbloqueios e limites |
| `static/audio-engine.js` | Contexto, buses de mix, stems opcionais e cleanup |
| `static/game.js` | História, persistência, settings, calibração, holds, resultados e arranjo por seção |
| `static/art.js` | Desenho animado do rival secreto |
| `templates/index.html`, `static/style.css` | Abas de modos, painel de história, configurações e dueto |
| `tests/*.test.cjs` | Timing, fluxo completo, desbloqueios, falhas e AudioEngine |
| `.github/workflows/tests.yml` | Execução das novas verificações no CI |
| `README.md`, este relatório | Execução, contratos e limites da entrega |

As configurações locais de IP já solicitadas foram preservadas no computador e não são necessárias para a publicação do código.

## Verificação executada

- `python manage.py check`: sem problemas.
- `python manage.py test`: seis testes, todos passaram.
- `python -m game.validate_charts`: 16 combinações de música/dificuldade válidas.
- `python manage.py collectstatic --noinput`: estáticos coletados.
- Suites `engine.test.cjs`, `gameplay.test.cjs` e `audio-engine.test.cjs` executadas em Node via runtime REPL, com VM e mocks de DOM/Canvas/tempo/áudio; todas passaram. O executável `node` não está no PATH deste Windows. O CI executa os mesmos arquivos via Node 22.
- Integração automatizada: partidas perfeitas em desktop/mobile, downscroll, toque em alturas diferentes, notas longas e soltura antecipada, esquivas, pausa/retomada, derrota, recordes, Story Hard e Insane, bloqueio e desbloqueio, fase secreta completa, persistência das configurações, storage indisponível e áudio bloqueado. AudioEngine: stems alinhados, volumes, falhas de rede/decode e cleanup.
- Navegador real via CUA: Story Mode com Freeplay desabilitado; abrir configurações; ajustar tamanho e scroll com teclado e observar os valores; restaurar; iniciar história; pausar e retornar. Sem erros de console nessa verificação. Não foi jogada manualmente uma história inteira nem realizada uma avaliação auditiva profissional.

## Limitações e pendências da especificação

- Não há stems OGG/WAV gravados ou licenciados no projeto. Há composição demonstrativa sintetizada e estrutura `AudioEngine.loadStems`/`startStems`, com erros de fetch/decode tratados e testes. Para produção, fornecer arquivos alinhados ao mesmo sample inicial por música: `music.ogg`, `drums.ogg`, `bass.ogg`, `vocals.ogg`, com fallback MP3/WAV e manifesto de URLs. Não há carregamento externo de stems ativo no jogo sem esses assets.
- A mix possui ganhos conservadores, envelopes e compressor; clipping audível, nível LUFS e qualidade musical precisam de medição e revisão auditiva em equipamentos reais. Não foram alegados resultados de medição que não ocorreram.
- O modo treino evita derrota e permite reinício rápido, mas não possui seleção de trecho/seeking.
- A renderização usa sprites em atlas e background em cache. A separação completa de Input/Renderer/NoteManager e sprites de vitória/derrota dedicados continuam como refatoração incremental; não houve reescrita cosmética.
- Ainda é recomendada uma matriz física de celulares/navegadores, testes longos de memória e medição de latência real. Os testes de stems e erros usam mocks; não substituem áudio gravado ou hardware real.
- Persistência é local ao navegador e pode ser apagada ou editada pelo usuário; não há ranking online.

O conteúdo dos documentos foi usado como referência de engenharia. As solicitações diretas do usuário de manter os modos, o Cartman e a identidade do jogo prevaleceram sobre orientações genéricas conflitantes. A expansão restante da especificação não foi declarada como concluída.
