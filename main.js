const pg = require('pg')

const pgPool = new pg.Pool(
    {
        user: "me@mydemoserver32",
        host: "mydemoserver32.postgres.database.azure.com",
        port: 5432,
        database: "hackathon23",
        password: "password",
        ssl: true
    }
)

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const port = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded(
{
    extended: true,
}));

app.get('/', async (request, response) =>
{
    response.setHeader("Content-Type", "application/json")
    response.send({"status": "ok"})
})

app.post('/sign-up', async (request, response) =>
{
    let databaseSuffix = "providers"

    if(request.body.type == 0)
    {
        databaseSuffix = "users"    
    }

    try
    {
        await pgPool.query("insert into " + databaseSuffix + " (name, address, n_id, password_hash) values ($1, $2, $3, $4)", [request.body.name, request.body.address, request.body.n_id, request.body.password_hash])

        response.send(
        {
            error_code: 0
        })
    }
    catch(error)
    {
        response.send(
        {
            error_code: -1
        })
    }
})

app.post("/login", async (request, response) =>
{
    let databaseSuffix = "providers"

    if(request.body.type == 0)
    {
        databaseSuffix = "users"    
    }

    let result = await pgPool.query("select id from " + databaseSuffix + " where name = $1", [request.body.name])
    let userPresent = false
    let loginCredsOk = false
    let errorCode = 0

    if(result.rowCount > 0)
    {
        userPresent = true;
    }
    else
    {
        errorCode = -1
    }

    if(userPresent)
    {
        result = await pgPool.query("select id from " + databaseSuffix + " where name = $1 and password_hash = $2", [request.body.name, request.body.password_hash])

        if(result.rowCount > 0)
        {
            loginCredsOk = true;
        }
        else
        {
            errorCode = -2
        }
    }

    const cookieString=request.body.name + Date.now()

    if(loginCredsOk)
    {
        // const cookieString = "id=" + result.rows[0].id + "; date=" + Date.now() + "; type=" + request.body.type

        await pgPool.query("insert into logged_in_" + databaseSuffix + " (cookie_string, user_id) values ($1, $2)", [cookieString, result.rows[0].id])
        response.setHeader("Set-Cookie", cookieString)
        response.cookie("id", result.rows[0].id)
    }
    
    response.send(
    {
        type: request.body.type,
        error_code: errorCode,
        name: cookieString
    })
})

app.post("/vaccine-registration", async (request, response) =>
{
    // const cookieString = request.header("Cookie")
    // const cookieList = cookieString.split("; ")
    // let cookiePairs = new Map()

    // for(let i = 0; i < cookieList.length; ++i)
    // {
    //     let splitTokens = cookieList[i].split("=") 

    //     cookiePairs.set(splitTokens[0], splitTokens[1])
    // }

    let result = null

    if(request.body.type == "0")
    {
        result = await pgPool.query("select user_id from logged_in_users where cookie_string = $1", [request.body.name])
    }
    else
    {
        response.send(
        {
            error_code: -1
        })
    }

    let userId = result.rows[0].user_id

    try
    {
        await pgPool.query("insert into vaccination (user_id, vaccine_id, vaccination_date) values($1, $2, $3)", [userId, request.body.vaccine_id, request.body.date])

        response.send(
        {
            error_code: 0
        })
    }
    catch(error)
    {
        response.send(
        {
            error_code: -2
        })
    }
})

app.post("/get-user-id", async (request, response) =>
{
    let result = await pgPool.query("select id\
                                from users\
                                where name = $1", [request.body.name])

    response.send(
    {
        error_code: 0,
        id: result.rows[0].id
    })
})

app.post("/vaccine-taker", async (request, response) =>
{
    let result = await pgPool.query("select vaccine.vaccine_id as v_id, vaccination_date, vaccine_name\
                                from vaccination\
                                join vaccine\
                                on vaccination.vaccine_id = vaccine.vaccine_id\
                                where user_id = $1", [request.body.user_id])

    let vaccineList = []

    for(let i = 0; i < result.rowCount; ++i)
    {
        vaccineList.push({vaccine_id: result.rows[i].v_id, date:result.rows[i].vaccination_date, vaccine_name: result.rows[i].vaccine_name})
    }

    response.send(
    {
        error_code: 0,
        list: vaccineList
    })
})

app.post("/vaccination-done", async (request, response) =>
{
    let result = await pgPool.query("select * from vaccination where user_id = $1 and vaccine_id = $2 and vaccination_date = $3", [request.body.user_id, request.body.vaccine_id, request.body.vaccine_date])

    if(result.rowCount > 0)
    {
        await pgPool.query("insert into vaccination_message\
                            (user_id, vaccine_id, vaccination_date)\
                            values($1, $2, $3)",
                            [
                                request.body.user_id,
                                request.body.vaccine_id,
                                request.body.vaccine_date
                            ])

        try
        {
            await pgPool.query("delete from vaccination\
                                where user_id = $1\
                                and vaccine_id = $2",
                                [
                                    request.body.user_id,
                                    request.body.vaccine_id
                                ])
            await pgPool.query("update users\
                                set unseen_count = unseen_count + 1\
                                where id = $1",
                                [request.body.user_id])

            response.send(
            {
                error_code: 0
            })
        }
        catch(error)
        {
            response.send(
            {
                error_code: -1
            })
        }
    }
    else
    {
        response.send(
        {
            error_code: -1
        })
    }
})

app.post("/message-seen", async (request, response) =>
{
    await pgPool.query("update users\
                        set unseen_count = 0\
                        where id = $1", [request.body.user_id])

    response.send(
    {
        error_code: 0
    })
})


const server = app.listen(process.env.PORT || port, () =>
{
    console.log("Server listening on port " + port)
})

module.exports = {app, server};