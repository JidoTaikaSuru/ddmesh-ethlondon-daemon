const axios = require("axios");

const BASE_URL = "https://console.neon.tech/api/v2"
const API_KEY =  process.env.NEON_API_KEY
const DELETE_DATABASE_INPLACE = process.env.DELETE_DATABASE_INPLACE || false
class NeonManagementApiClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl
        this.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        }
    }


    async getFirstProjectId() {
        console.log(`${this.baseUrl}/projects`)
        const res =  await axios.get(`${this.baseUrl}/projects`, {
            headers: this.headers,
        })
        return res.data.projects?.[0]?.id
    }
    
    async getFirstBranchId(projectId) {
        console.log(`${this.baseUrl}/projects/${projectId}/branches`)
        const res =  await axios.get(`${this.baseUrl}/projects/${projectId}/branches`, {
            headers: this.headers,
        })
        return res.data.branches?.[0]?.id
    }
    async getFirstDatabaseObject(projectId, branchId) {
        console.log(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`)
        const res =  await axios.get(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`, {
            headers: this.headers,
        })
        console.log(res.data)

        return res.data.databases?.[0]
    }
    async getDatabaseObjectByName(projectId, branchId, dbName){
        console.log(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`)
        const res =  await axios.get(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`, {
            headers: this.headers,
        })
        console.log(res.data)

        return res.data.databases?.find(db => db.name === dbName)
    }
    async getDatabaseObjectById(projectId, branchId, dbId){
        console.log(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`)
        const res =  await axios.get(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`, {
            headers: this.headers,
        })
        console.log(res.data)

        return res.data.databases?.find(db => db.id === dbId)
    }
    async getFirstRoleName(projectId, branchId) {
       console.log(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles`)
        const res =  await axios.get(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles`, {
            headers: this.headers,
        })
        console.log(res.data)
        console.log("Dumping roles")
        return res.data.roles?.[0]?.name
    }

    async resetRolePassword(projectId, branchId, roleName){
        console.log(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles/${roleName}/reset_password`)
        const res = await axios.post(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles/${roleName}/reset_password`, {},{
            headers: this.headers,
        })
        console.log(res.data)
        return res.data.role.password
    }

    async createDatabase(dbName){
       console.log(`Creating database ${dbName}`)
        console.log("Getting first project id")
        let projectId = await this.getFirstProjectId()
        if(!projectId){
            console.log("No project found, creating one")
            projectId = await this.createProject("newProjectddmesh")
        }
        console.log("Getting first branch id")
        let branchId = await this.getFirstBranchId(projectId)
        if(!branchId){
            console.log("No branch found, creating one")
            branchId = await this.createBranch(projectId)
        }

        console.log("Checking if database already exists...")
        //sleep 2s
        const dbObject = await this.getDatabaseObjectByName(projectId, branchId, dbName)
        if(dbObject){
            if(DELETE_DATABASE_INPLACE) {
                console.log("Database already exists, deleting it", dbObject)
                await this.deleteDatabase(dbObject.name, projectId, branchId)
                await new Promise(r => setTimeout(r, 2000)); //Sleep 2s to let operation finish
            } else {
                //TODO later check if the user is free tier or not.
                throw new Error("You can only have one database in the free tier of Neon")
            }
        }
        console.log("Getting first role name")
        const roleName = await this.getFirstRoleName(projectId, branchId)
        if(!roleName){
            throw new Error("No role found, haven't programmed in creating yet, it's an SQL query")
        }
        console.log("Resetting role password")
        const password = await this.resetRolePassword(projectId, branchId, roleName)
        console.log("Creating db now")
        const res = await axios.post(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`, {
            database: {
                name: dbName,
                owner_name: roleName,
            }
        }, {headers: this.headers})
        console.log("finished db creation")
        console.log(res.data)
        res.data.database.password = password
        const operations = res.data.operations?.[0]
        res.data.database.connectionString = `postgresql://${roleName}:${res.data.database.password}@${operations.endpoint_id}.us-east-2.aws.neon.tech/${res.data.database.name}?sslmode=require`
        console.log("Created database: ", res.data)

        return res.data
    }
    async deleteDatabase(dbName, projectId, branchId){
        console.log(`Deleting database ${dbName}`)
        const res = await axios.delete(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases/${dbName}`, {
            headers: this.headers,
        })
        console.log(res.data)
        return res
    }


    async createProject(){
        const res = await axios.post(`${this.baseUrl}/projects`, {
            name: projectName,
        }, {headers: this.headers})
        return res.project.id
    }

    async createBranch(){
        const projectId = await this.getFirstProjectId()
        const res = await axios.post(`${this.baseUrl}/projects/${projectId}/branches`, { }, {headers: this.headers})
        return res.branch.id
    }

    //https://supabase.com/docs/reference/api/create-a-project
    // Trust me on the parameters, tested in postman
    async createProjectSupabase(projectName){
        const dbPass = this.generateRandomPassword(32)
        const res = await axios.post(`${this.baseUrl}/projects`, {
            name: projectName,
        }, {headers: this.headers})
        res.db_pass = dbPass
        return res
    }

    // YOU CANNOT CURRENTLY DELETE A PROJECT
    //Generated by ChatGPT
    generateRandomPassword(length) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        return password;
    }
}

// const neon = new NeonManagementApiClient(BASE_URL, API_KEY)

// async function main() {
//     const projectId = await neon.getFirstProjectId()
//     const branchId = await neon.getFirstBranchId(projectId)
//     const roleName = await neon.getFirstRoleName(projectId, branchId)
//     const databaseId = await neon.getFirstDatabaseObject(projectId, branchId)
//     const database = await neon.createDatabase("newdb")
//     // postgresql://neondb_owner:************@ep-small-king-a5un0osx.us-east-2.aws.neon.tech/newdb7%3A37%3A52%20AM?sslmode=require
//     //TODO not sure if region is hardcoded in Neon

//     //Sleep 5 seconds
//     // await new Promise(r => setTimeout(r, 5000));
//     // const databaseId2 = await neon.getFirstDatabaseObject(projectId, branchId)
//     // await neon.deleteDatabase(databaseId2.id, projectId, branchId)
// }

// main().catch(console.error);

module.exports = {
    NeonManagementApiClient,
    BASE_URL
}
