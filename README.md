# FNF · Ponto de Ruptura

Fan game de ritmo em português, inspirado em Friday Night Funkin’. Django/Python serve a página e gera os mapas; HTML, Bootstrap local, CSS e JavaScript Canvas/Web Audio executam o duelo no navegador com baixa latência.

## Jogar no Windows

Instale Python 3.12 ou mais recente. Abra `iniciar.bat`, ou execute:

```powershell
python -m pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

Abra http://127.0.0.1:8000 . Para celular na mesma rede, configure `ALLOWED_HOSTS` com o IP local do computador e abra `http://IP-DO-COMPUTADOR:8000`. O firewall da sua rede precisa permitir a conexão. O endereço local não é uma publicação na internet.

## A semana

| Fase | BPM | Experiência |
|---|---:|---|
| Pavio Curto | 128 | Síncopes, inversões, variações de frase e sustentações |
| Pressão Alta | 158 | Semicolcheias, acordes ocasionais e rival furioso |
| CRASHOUT | 190 | Rajadas, acordes de duas notas, interrupções do rival e nove ataques de microfone |

**D/F/J/K**, da esquerda para a direita. As orientações são **esquerda / baixo / cima / direita (EBCD)**, nessa ordem. As notas e receptores são bolinhas coloridas. Segure as notas com cauda. **Espaço** desvia na fase final: o aviso aparece 800 ms antes, três beeps alertam e a esquiva aceita a entrada nos últimos 650 ms antes do golpe até 100 ms depois. Um acerto de microfone remove 40% de uma unidade de vida; errar notas também reduz a vida. **Esc** pausa; ao sair da aba o jogo pausa automaticamente.

No celular, use os quatro botões e **DESVIAR**. Há detecção automática de tela/toque e escolha manual em **Como jogar**, além de ajuste de áudio de -200 a +200 ms. O som começa após clicar em uma fase. Os recordes ficam neste navegador, via localStorage. Todas as fases ficam disponíveis no menu; após vencer, é possível seguir para a próxima.

## Arquitetura

- `game/charts.py`: mapas determinísticos, grade musical, dificuldade e ataques.
- `game/views.py`: página e endpoints `/api/levels/`, `/api/charts/1/` até `/3/`.
- `static/game.js`: relógio de áudio, trilha sintetizada, input, vida, combo, julgamento, pausa e resultados.
- `static/engine.js`: regras puras de timing e esquiva.
- `static/art.js`: arte vetorial própria dos personagens e do palco.
- `templates/index.html` e `static/style.css`: menu, dialogs e layouts responsivos.

O relógio mestre é `AudioContext.currentTime`. Pausar suspende áudio e tempo simultaneamente. A trilha usa baixo, bateria sintetizada, acordes e vozes eletrônicas em resposta aos mapas. Sem arquivo de áudio externo ou chaves de API. Bootstrap está incluído; fontes Google são opcionais, com fallback local.

## Verificação

```powershell
python manage.py check
python manage.py test
node tests/engine.test.cjs
node tests/gameplay.test.cjs
```

Testes cobrem rotas, mapas determinísticos, dificuldade crescente, duração, sobreposição de sustentações, ataques e regras de julgamento/esquiva. GitHub Actions executa as verificações em cada push e PR.

## Servidor de produção

Em um host Python com HTTPS, defina `DEBUG=0`, `SECRET_KEY` com um segredo aleatório e `ALLOWED_HOSTS` com seu domínio. Depois:

```powershell
python -m pip install -r requirements.txt
python manage.py collectstatic --noinput
python serve.py
```

Waitress serve WSGI e WhiteNoise entrega os estáticos; `PORT` é opcional. Use um proxy/host com HTTPS. Não use `runserver` como servidor público de produção. A aplicação não exige banco de dados. Documentação: https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

## Créditos e escopo

Referência solicitada: https://gamebanana.com/games/8694 . Friday Night Funkin’ pertence aos seus respectivos criadores. Esta é uma adaptação web independente e não um mod carregável no Psych Engine/Funkin original. Personagem rival Raze, desenhos vetoriais e trilha sintetizada foram criados para este projeto; não contém sprites ou gravações oficiais. A jogabilidade segue o duelo de quatro pistas, notas ascendentes, sustentações, julgamentos e barra de vida do jogo de referência. Bootstrap mantém seu aviso de licença MIT no arquivo distribuído.
