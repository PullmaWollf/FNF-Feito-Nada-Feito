# Publicar na Vercel

O repositório usa o suporte nativo a Django da Vercel. Não use configurações antigas com `builds`, rewrites para `/api` ou exportação estática da página.

1. Na Vercel, **Add New → Project** e importe `PullmaWollf/FNF-Feito-Nada-Feito`.
2. Root Directory: raiz do repositório. Framework: **Django** (declarado em `vercel.json`).
3. Mantenha Install/Build/Output nos padrões da integração. A Vercel instala `requirements.txt` e coleta os estáticos usando `STATIC_ROOT`.
4. Python está definido em `.python-version`: **3.13**. O entrypoint é `config/wsgi.py`, descoberto por `WSGI_APPLICATION`.
5. Clique Deploy. Não é necessário banco de dados ou chave de IA para jogar ou usar o Estúdio.

`VERCEL=1` ativa DEBUG falso, HTTPS e hosts `.vercel.app`. Para domínio próprio, configure `ALLOWED_HOSTS` com o domínio, separado por vírgulas. `SECRET_KEY` pode ser configurada com valor aleatório e estável nas variáveis da Vercel. Hoje não existem login ou sessões; na ausência dessa variável é gerado um segredo forte por instância, sem valor público fixo.

Os MP3/PNG e JavaScript são estáticos servidos pelo CDN. A análise de músicas personalizadas roda no navegador em Worker; os arquivos ficam no IndexedDB. Nenhuma função da Vercel recebe uploads grandes, roda Whisper ou tenta gravar na pasta do servidor. A biblioteca local varia por origem/dispositivo: localhost, IP local e domínio Vercel têm bibliotecas e desbloqueios separados.

## Verificação de configuração

- `python manage.py check`
- `python manage.py test`
- `python -m game.validate_charts`
- `python manage.py collectstatic --noinput`
- Com `VERCEL=1` e `DEBUG=0`: `python manage.py check --deploy`

Essas verificações foram executadas localmente. O último check de produção foi executado com Python 3.13. Isso não equivale a um deployment READY: não foi criado projeto nem feito deploy na conta do usuário.

Fonte da configuração: https://vercel.com/docs/frameworks/full-stack/django
