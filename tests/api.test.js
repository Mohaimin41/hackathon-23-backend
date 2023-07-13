const request = require("supertest")
const baseURL = "http://localhost:3000"
const {app, server} = require('../main')

describe("GET /", () => {
    it("should return hehe", async () => {
        const response = await request(app).get("/")

        expect(response._body.status).toBe("ok")
        server.close()
    })
})