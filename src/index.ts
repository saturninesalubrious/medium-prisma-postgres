import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Bindings, Variables } from 'hono/types'
import { decode, sign, verify } from 'hono/jwt'
import { SignatureKey } from 'hono/utils/jwt/jws'


const app = new Hono<{
    Bindings: {
      JWTSECRET: SignatureKey
      DATABASE_URL: string
    } 
}>()


//middleware

app.use('/api/v1/blog/*', async (c, next) => {

  const header = c.req.header("authorization") || "";

  const token = header.split(" ")[1]

  const response = await verify(token, c.env.JWTSECRET)

  if (response.id) {
    next()
  } else {
    c.status(403)
    return c.json({ error: "unauthorised" })
  }
})

//routes

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app


app.post('/api/v1/signup', async (c) => {


const prisma = new PrismaClient({datasourceUrl: c.env.DATABASE_URL}).$extends(withAccelerate())

const body = await c.req.json();

 const user =  await prisma.user.create({
  data: {
    email: body.email,
    password: body.password
  }
})

const token = sign({id: user.id}, c.env.JWTSECRET)

return c.json({token})
});


app.post('/api/v1/signin', async (c) => {


  const prisma = new PrismaClient({datasourceUrl: c.env.DATABASE_URL}).$extends(withAccelerate())
  
  const body = await c.req.json();
  
   const user =  await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password
    }
  })
  
  if (!user) {
    c.status(403);
    return c.json({error: "User not found"})
  }
  
  const token = sign({id: user.id}, c.env.JWTSECRET)
  
  return c.json({token})
  });





