# Bot de Gerenciamento de Servidor AWS

Este projeto é um bot do Discord que gerencia um servidor AWS. Ele pode iniciar, parar e obter o status do servidor. Também tem a capacidade de obter o custo mensal do servidor.

## Comandos

- `foo`: Retorna 'bar'.
- `startserver`: Inicializa o Server.
- `stopserver`: Para o Server.
- `status`: Obtém o status do servidor.
- `getcost`: Obtém o custo mensal do servidor.

## AWS Lambda

1. Clone o repositório.
2. Na pasta aws
3. Instale as dependências com `npm install`.
4. Compacte os arquivos no formato .zip
5. Faça o upload na aws no lambda
6. Configure suas variáveis de ambiente na aws. Você precisará das seguintes variáveis:
    - `PUBLIC_KEY`: Sua chave pública.
    - `INSTANCE_ID`: Seu ID de instância AWS.
    - `AWS_ECS_REGION`: Sua regiao da AWS
    - `ROLE_ID` : O cargo permitido para usar o bot
    - `CHANNEL_ID`: O canal onde é permitido usar o bot    

## Discord

1. Clone o repositório.
2. Na pasta discord
3. Instale as dependências com `npm install`.
4. Configure suas variáveis de ambiente em umarquivo `.env`. Você precisará das seguintes variáveis:
    - `APP_ID`: Seu ID de aplicativo Discord.
    - `GUILD_ID`: Seu ID do servidor Discord.
    - `BOT_TOKEN`: Seu token de bot Discord.
5. Execute `node addcommand.js` para adicionar os comandos ao seu bot do Discord.


Se precisar deletar um command, utilize o script `removecommand.js` adicionando o id do command.