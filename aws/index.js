const { EC2Client, StartInstancesCommand, StopInstancesCommand, DescribeInstancesCommand} = require('@aws-sdk/client-ec2')
const { CostExplorer, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer')
const nacl = require('tweetnacl');


const ec2Client = new EC2Client({ region: process.env.AWS_ECS_REGION })
const costExplorerClient = new CostExplorer({ region: process.env.AWS_ECS_REGION })


exports.handler = async (event) => {
    try {
        const response = await doHandle(event)
        if(typeof(response) == 'string')
            return buildResponse(response)
        return response
    } catch (error) {
        console.log(error.message)
        if (error instanceof InvalidRoleException) {
            return invalidRoleResponse
        }

        if (error instanceof InvalidChannelException) {
            return invalidChannelResponse
        }

        if (error instanceof InvalidSignatureException) {
            return invalidSignatureResponse
        }

        return genericErrorResponse
    }
};

async function doHandle(event) {
    const PUBLIC_KEY = process.env.PUBLIC_KEY;
    const instanceId = process.env.INSTANCE_ID
    const signature = event.headers['x-signature-ed25519']
    const timestamp = event.headers['x-signature-timestamp'];
    let strBody = event.body;

    verifySignature(signature, timestamp, PUBLIC_KEY, strBody)

    // Replying to ping (requirement 2.)
    const body = JSON.parse(strBody)
    
    if (body.type == 1) {
        return {
            statusCode: 200,
            body: JSON.stringify({ "type": 1 }),
        }
    }


    validate(body)
    //from here everthing must be on the right channel and have the right role

    if (body.data.name == 'foo') {
        return "bar"
    }

    if (body.data.name == 'startserver') {
        return await startServer(body, instanceId)
    }

    if (body.data.name == 'stopserver') {
        return await stopServer(body, instanceId)
    }

    if (body.data.name == 'status') {
        return await getStatus(body, instanceId)
    }

    if(body.data.name == 'getcost'){
        return await getMonthlyCost()
    }


    return {
        statusCode: 422
    }
}

async function getStatus(body, instanceId){
    
    const describeInstances = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
    })
    var description = await ec2Client.send(describeInstances)
    const ip = description.Reservations[0].Instances[0].PublicIpAddress
    const serverstate = description.Reservations[0].Instances[0].State.Name
    return `ServerState: ${serverstate} ip: ${ip}`
}

async function startServer(body, instanceId) {
    return await manageServer(body, instanceId, 'start');
}

async function stopServer(body, instanceId) {
    return await manageServer(body, instanceId, 'stop');
}

async function manageServer(body, instanceId, action) {
    if (action === 'start') {
        const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
        await ec2Client.send(command);
        return "Server iniciado";
    }

    if (action === 'stop') {
        const command = new StopInstancesCommand({ InstanceIds: [instanceId] });
        await ec2Client.send(command);
        return "Server desligado";
    }

    throw new Error(`Invalid action: ${action}`);
}

async function getMonthlyCost(){
    const currentDate = new Date();
    
    // Obtém o primeiro dia do mês atual
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Obtém o último dia do mês atual
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Formata as datas como strings 'YYYY-MM-DD'
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];

    const params = {
        TimePeriod: {
            Start: startDate, // Primeiro dia do mês atual
            End: endDate      // Último dia do mês atual
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        Filter: {
            Dimensions: {
                Key: 'SERVICE',
                Values: ['Amazon Elastic Compute Cloud - Compute']
            }
        }
    };

    try {
        const getCostAndUsage = new GetCostAndUsageCommand(params)
        const data = await costExplorerClient.send(getCostAndUsage)
        // Acessa diretamente o valor em dólares do custo
        const costAmount = data.ResultsByTime[0].Total.UnblendedCost.Amount;
        const costAmountRounded = parseFloat(costAmount).toFixed(2); // Arredonda para 2 casas decimais
        return `Custo: $${costAmountRounded} USD`;
    } catch (error) {
        console.log(error)
        throw new Error('Erro ao obter dados do Cost Explorer');
    }
  }



function validate(body) {
    validateRole(body.member.roles)
    validateChannel(body.channel_id)
}

function validateRole(roles) {
    const ROLE_ID = process.env.ROLE_ID;
    if (!roles.includes(ROLE_ID)) {
        throw new InvalidRoleException('Invalid Role for it')
    }
}

function validateChannel(channel) {
    const CHANNEL_ID = process.env.CHANNEL_ID;

    if (channel != CHANNEL_ID) {
        throw new InvalidChannelException('Invalid Channel for it')
    }
}

const buildResponse = (ret) => ({
    statusCode: 200,
    body: JSON.stringify({
        "type": 4,
        "data": {
            "content": ret
        },
    }),
    headers: {
        "Content-Type": "application/json"
    }
})

function verifySignature(signature, timestamp, publicKey, strBody) {
    const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + strBody),
        Buffer.from(signature, 'hex'),
        Buffer.from(publicKey, 'hex')
    );

    if (!isVerified) {
        throw new InvalidSignatureException()
    }
}

const invalidSignatureResponse = {
    statusCode: 401,
    body: JSON.stringify('invalid request signature'),
};

const invalidRoleResponse = buildResponse("Invalid Role for it")

const invalidChannelResponse = buildResponse("Invalid Channel")

const genericErrorResponse = buildResponse("error during script")


class InvalidRoleException extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

class InvalidChannelException extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

class InvalidSignatureException extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}
